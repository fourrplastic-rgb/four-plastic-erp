from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import ta
import numpy as np
import traceback
import os
from openai import OpenAI

app = Flask(__name__)
CORS(app)

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "message": "FinSight Backend is running"})

@app.route('/api/market/data', methods=['GET'])
def get_market_data():
    ticker = request.args.get('ticker', 'AAPL')
    period = request.args.get('period', '3mo')
    
    # Dynamically set interval based on period
    interval = '1d'
    if period == '1d':
        interval = '5m'
    elif period == '1wk':
        interval = '15m'
    
    try:
        # Fetch data from yfinance
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)
        
        if df.empty:
            return jsonify({"error": "No data found for this ticker"}), 404
            
        # Add basic technical indicators using `ta` library
        # RSI
        df['RSI'] = ta.momentum.RSIIndicator(df['Close'], window=14).rsi()
        
        # MACD
        macd = ta.trend.MACD(df['Close'])
        df['MACD'] = macd.macd()
        df['MACD_Signal'] = macd.macd_signal()
        df['MACD_Hist'] = macd.macd_diff()
        
        # Bollinger Bands
        indicator_bb = ta.volatility.BollingerBands(close=df['Close'], window=20, window_dev=2)
        df['BB_High'] = indicator_bb.bollinger_hband()
        df['BB_Low'] = indicator_bb.bollinger_lband()
        df['BB_Mid'] = indicator_bb.bollinger_mavg()
        
        # Simple Moving Averages
        df['SMA_20'] = ta.trend.SMAIndicator(df['Close'], window=20).sma_indicator()
        df['SMA_50'] = ta.trend.SMAIndicator(df['Close'], window=50).sma_indicator()

        # Exponential Moving Averages for high-accuracy crossover
        df['EMA_9'] = ta.trend.EMAIndicator(df['Close'], window=9).ema_indicator()
        df['EMA_21'] = ta.trend.EMAIndicator(df['Close'], window=21).ema_indicator()
        
        # Clean up NaN values for JSON serialization
        df = df.replace({np.nan: None})
        
        # Prepare response format
        data = []
        for date, row in df.iterrows():
            # For intraday, show time. For daily, show date.
            if interval in ['5m', '15m']:
                time_str = date.strftime('%H:%M')
            else:
                time_str = date.strftime('%Y-%m-%d')
                
            data.append({
                "time": time_str,
                "open": float(row['Open']) if row['Open'] else None,
                "high": float(row['High']) if row['High'] else None,
                "low": float(row['Low']) if row['Low'] else None,
                "close": float(row['Close']) if row['Close'] else None,
                "volume": int(row['Volume']) if row['Volume'] else None,
                "rsi": float(row['RSI']) if row['RSI'] is not None else None,
                "macd": float(row['MACD']) if row['MACD'] is not None else None,
                "macd_signal": float(row['MACD_Signal']) if row['MACD_Signal'] is not None else None,
                "bb_high": float(row['BB_High']) if row['BB_High'] is not None else None,
                "bb_low": float(row['BB_Low']) if row['BB_Low'] is not None else None,
                "bb_mid": float(row['BB_Mid']) if row['BB_Mid'] is not None else None,
                "sma_20": float(row['SMA_20']) if row['SMA_20'] is not None else None,
                "sma_50": float(row['SMA_50']) if row['SMA_50'] is not None else None,
                "ema_9": float(row['EMA_9']) if row['EMA_9'] is not None else None,
                "ema_21": float(row['EMA_21']) if row['EMA_21'] is not None else None
            })
            
        info = stock.info
        meta = {
            "symbol": ticker,
            "shortName": info.get("shortName", ticker),
            "regularMarketPrice": info.get("regularMarketPrice", info.get("currentPrice", data[-1]["close"] if data else None)),
            "regularMarketChangePercent": info.get("regularMarketChangePercent", None),
            "currency": info.get("currency", "USD"),
            "marketCap": info.get("marketCap", None)
        }

        # Calculate Master Signal
        if len(data) > 0:
            latest = data[-1]
            score = 0
            
            # 1. Trend: EMA 9 vs EMA 21
            if latest.get('ema_9') and latest.get('ema_21'):
                if latest['ema_9'] > latest['ema_21']:
                    score += 2
                else:
                    score -= 2
                    
            # 2. Momentum: MACD
            if latest.get('macd') and latest.get('macd_signal'):
                if latest['macd'] > latest['macd_signal']:
                    score += 1
                else:
                    score -= 1
                    
            # 3. Overbought/Oversold: RSI
            if latest.get('rsi'):
                if latest['rsi'] < 30:
                    score += 1 # Oversold, good time to buy
                elif latest['rsi'] > 70:
                    score -= 1 # Overbought, good time to sell
            
            # 4. Volatility: Price vs Bollinger
            if latest.get('close') and latest.get('bb_low') and latest.get('bb_high'):
                if latest['close'] <= latest['bb_low'] * 1.02:
                    score += 1 # Near bottom band, potential bounce
                elif latest['close'] >= latest['bb_high'] * 0.98:
                    score -= 1 # Near top band, potential rejection
                    
            # Determine String Signal
            if score >= 4:
                master_signal = "STRONG BUY"
            elif score >= 1:
                master_signal = "BUY"
            elif score <= -4:
                master_signal = "STRONG SELL"
            elif score <= -1:
                master_signal = "SELL"
            else:
                master_signal = "NEUTRAL"
                
            meta['masterSignal'] = master_signal
            meta['masterScore'] = score
            
        return jsonify({
            "meta": meta,
            "data": data
        })
        
    except Exception as e:
        print(f"Error fetching data for {ticker}: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/market/analyze', methods=['POST'])
def analyze_market():
    try:
        data = request.json
        ticker = data.get('ticker', 'Unknown')
        current_price = data.get('price', 0)
        rsi = data.get('rsi', 0)
        macd = data.get('macd', 0)
        sma20 = data.get('sma20', 0)
        sma50 = data.get('sma50', 0)

        bb_high = data.get('bb_high', 0)
        bb_low = data.get('bb_low', 0)

        # Mock response if no API key
        if not os.environ.get("OPENAI_API_KEY"):
            trend = "Bullish" if sma20 > sma50 else "Bearish"
            rsi_condition = "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral"
            
            bb_width = bb_high - bb_low
            volatility = "high" if (bb_width / current_price) > 0.05 else "low"
            bb_position = "near the upper band (potential resistance)" if current_price > bb_high * 0.98 else "near the lower band (potential support)" if current_price < bb_low * 1.02 else "within the normal range"
            
            mock_analysis = f"**Technical Breakdown for {ticker}**\n\n"
            mock_analysis += f"📈 **Trend Analysis**: The short-term sentiment is currently **{trend.upper()}**, as the 20-Day SMA is {'above' if trend == 'Bullish' else 'below'} the 50-Day SMA. "
            
            mock_analysis += f"\n\n📊 **Momentum (RSI & MACD)**: The Relative Strength Index (RSI) is sitting at {rsi:.2f}, indicating the asset is {rsi_condition}. "
            if macd > 0:
                mock_analysis += "Furthermore, the MACD histogram is positive, confirming underlying upward momentum in the recent price action. "
            else:
                mock_analysis += "However, the MACD histogram is negative, suggesting bearish pressure may be building. "
                
            mock_analysis += f"\n\n⚡ **Volatility (Bollinger Bands)**: Market volatility is relatively {volatility}. The current price (${current_price:,.2f}) is trading {bb_position}. "
            
            mock_analysis += "\n\n*Note: This is a simulated algorithmic breakdown. Set your OPENAI_API_KEY to activate deep GPT reasoning.*"
            
            return jsonify({"analysis": mock_analysis})

        # Real OpenAI Call
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        prompt = f"""
        You are a professional financial quantitative analyst.
        Analyze the following technical indicators for the asset {ticker}:
        - Current Price: ${current_price}
        - RSI (14): {rsi}
        - MACD: {macd}
        - 20-Day SMA: ${sma20}
        - 50-Day SMA: ${sma50}
        
        Provide a concise 3-4 sentence market insight summary explaining what these indicators mean for the short-term price action. Do not give financial advice. Keep it professional.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250
        )
        
        analysis = response.choices[0].message.content
        return jsonify({"analysis": analysis})
        
    except Exception as e:
        print(f"AI Analysis Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Failed to generate AI analysis"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

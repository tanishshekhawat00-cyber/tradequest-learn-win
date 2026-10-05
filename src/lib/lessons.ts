export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Lesson = {
  id: string;
  level: Level;
  title: string;
  minutes: number;
  xp: number;
  summary: string;
  body: string[];
  example: string;
  quiz: { q: string; options: string[]; answer: number }[];
};

export const LESSONS: Lesson[] = [
  {
    id: "what-is-a-stock", level: "Beginner", title: "What is a stock?", minutes: 4, xp: 40,
    summary: "Owning a small slice of a company.",
    body: [
      "A stock (or share) represents partial ownership of a company. If a company has 1,000 shares and you own 10, you own 1% of it.",
      "Companies issue shares to raise money. Investors buy them hoping the company grows, making each share more valuable, or pays dividends from its profits.",
      "Share prices move every second the market is open because buyers and sellers constantly change what they are willing to pay.",
    ],
    example: "You buy 5 shares of a company at ₹1,000 each (₹5,000). A year later the price is ₹1,150. Your shares are now worth ₹5,750 — an unrealized gain of ₹750.",
    quiz: [
      { q: "Owning a share means you…", options: ["Lent money to the company", "Own a small part of the company", "Are guaranteed a profit"], answer: 1 },
      { q: "Why do share prices change?", options: ["The government sets them daily", "Supply and demand from buyers and sellers", "They only change once a year"], answer: 1 },
    ],
  },
  {
    id: "what-is-a-market", level: "Beginner", title: "What is a market?", minutes: 4, xp: 40,
    summary: "Where buyers and sellers meet.",
    body: [
      "A stock market is a venue where buyers and sellers trade shares. In India the major exchanges are the NSE and BSE.",
      "Each trade needs a buyer and a seller agreeing on a price. The best price someone will pay is the 'bid'; the lowest price someone will sell for is the 'ask'.",
      "Indexes like the NIFTY 50 track a basket of large companies to show how the overall market is doing.",
    ],
    example: "If the bid is ₹499.50 and the ask is ₹500.00, a market buy order will usually fill near ₹500.",
    quiz: [
      { q: "An index measures…", options: ["One company's profit", "The performance of a basket of stocks", "Interest rates"], answer: 1 },
      { q: "The 'ask' price is…", options: ["The lowest price a seller accepts", "The highest price a buyer pays", "Yesterday's close"], answer: 0 },
    ],
  },
  {
    id: "market-vs-limit", level: "Beginner", title: "Market vs limit orders", minutes: 5, xp: 50,
    summary: "Speed versus price control.",
    body: [
      "A market order executes immediately at the best available price. You get speed, but not price certainty.",
      "A limit order only executes at your chosen price or better. A limit buy at ₹950 fills only if the price drops to ₹950 or lower.",
      "In TradeQuest, pending limit orders are checked against simulated prices and fill automatically when the condition is met.",
    ],
    example: "A stock trades at ₹1,000. You place a limit buy at ₹970. If the price dips to ₹968, your order fills at the market price at that moment.",
    quiz: [
      { q: "Which order guarantees immediate execution?", options: ["Limit order", "Market order", "Neither"], answer: 1 },
      { q: "A limit sell at ₹1,200 fills when price is…", options: ["₹1,200 or higher", "₹1,200 or lower", "Exactly ₹1,000"], answer: 0 },
    ],
  },
  {
    id: "what-is-pnl", level: "Beginner", title: "What is P&L?", minutes: 4, xp: 40,
    summary: "Profit and loss — realized and unrealized.",
    body: [
      "P&L means profit and loss. Unrealized P&L is the gain or loss on positions you still hold. Realized P&L is locked in when you sell.",
      "Return % compares the gain to what you invested: (current value − cost) ÷ cost × 100.",
    ],
    example: "Bought 10 shares at ₹200 (₹2,000). Price now ₹230: unrealized P&L is +₹300 (+15%). Sell 5 at ₹230: realized P&L is +₹150.",
    quiz: [
      { q: "Unrealized P&L is on positions you…", options: ["Have sold", "Still hold", "Never bought"], answer: 1 },
      { q: "Cost ₹1,000, value ₹1,100. Return %?", options: ["1%", "10%", "110%"], answer: 1 },
    ],
  },
  {
    id: "diversification", level: "Beginner", title: "What is diversification?", minutes: 5, xp: 50,
    summary: "Don't put all your eggs in one basket.",
    body: [
      "Diversification means spreading money across different companies and sectors so one bad event doesn't sink your whole portfolio.",
      "Holding five IT companies is less diversified than holding one IT, one bank, one pharma, one utility and one consumer company.",
    ],
    example: "If 80% of your portfolio is one stock and it falls 20%, your portfolio falls 16%. Spread across 5 equal positions, the same drop costs you 4%.",
    quiz: [
      { q: "Which portfolio is more diversified?", options: ["5 IT stocks", "Stocks from 5 different sectors", "1 stock"], answer: 1 },
      { q: "Diversification mainly reduces…", options: ["Taxes", "Concentration risk", "Trading fees"], answer: 1 },
    ],
  },
  {
    id: "risk-reward", level: "Intermediate", title: "Risk / reward", minutes: 6, xp: 70,
    summary: "Compare what you could lose with what you could gain.",
    body: [
      "Before entering a trade, define where you'd exit if wrong (risk) and where you'd take profit (reward).",
      "A 1:3 risk/reward means risking ₹1 to potentially make ₹3. With good risk/reward you can be wrong more often than right and still come out ahead.",
    ],
    example: "Entry ₹500, stop-loss ₹480 (risk ₹20), target ₹560 (reward ₹60): risk/reward is 1:3.",
    quiz: [
      { q: "Entry 100, stop 95, target 115. Risk/reward?", options: ["1:1", "1:3", "3:1"], answer: 1 },
      { q: "Good risk/reward lets you…", options: ["Never lose", "Be profitable even with a lower win rate", "Avoid stop-losses"], answer: 1 },
    ],
  },
  {
    id: "position-sizing", level: "Intermediate", title: "Position sizing", minutes: 6, xp: 70,
    summary: "How much to put into a single trade.",
    body: [
      "Position sizing decides how many shares to buy. A common rule is to risk only 1–2% of your portfolio on any single trade.",
      "Shares = (portfolio × risk %) ÷ (entry − stop).",
    ],
    example: "Portfolio ₹5,00,000, risk 1% = ₹5,000. Entry ₹1,000, stop ₹950 (₹50 risk/share) → buy 100 shares.",
    quiz: [
      { q: "₹1,00,000 portfolio, 2% risk, ₹20 risk/share. Shares?", options: ["50", "100", "200"], answer: 1 },
      { q: "Position sizing mostly controls…", options: ["How much you can lose per trade", "The stock's price", "Dividends"], answer: 0 },
    ],
  },
  {
    id: "stop-losses", level: "Intermediate", title: "Stop-losses", minutes: 5, xp: 60,
    summary: "A pre-planned exit when you're wrong.",
    body: [
      "A stop-loss order sells your position automatically if price falls to a level you choose, limiting losses.",
      "Place stops based on logic (below support, or a fixed % you can tolerate), not randomly. In TradeQuest you can attach stop-loss and take-profit orders to any holding.",
    ],
    example: "You hold shares bought at ₹800 and set a stop at ₹760. If price drops to ₹758, the stop triggers and sells near that price — a ~5% loss instead of a potentially larger one.",
    quiz: [
      { q: "A stop-loss sell triggers when price…", options: ["Rises to the stop", "Falls to the stop", "Stays flat"], answer: 1 },
      { q: "Main purpose of a stop-loss?", options: ["Limit downside", "Guarantee profit", "Increase volatility"], answer: 0 },
    ],
  },
  {
    id: "volatility", level: "Intermediate", title: "Volatility", minutes: 5, xp: 60,
    summary: "How much prices swing.",
    body: [
      "Volatility measures how much a price moves up and down. High volatility means bigger swings — more opportunity and more risk.",
      "Volatile stocks need wider stops and smaller position sizes to keep risk constant.",
    ],
    example: "Stock A moves ±0.5% a day; Stock B moves ±4%. Holding the same rupee amount, B can swing your portfolio 8× more.",
    quiz: [
      { q: "High volatility means…", options: ["Small price moves", "Large price swings", "Guaranteed gains"], answer: 1 },
      { q: "For a more volatile stock you should usually…", options: ["Use a smaller position", "Use a larger position", "Skip stop-losses"], answer: 0 },
    ],
  },
  {
    id: "allocation", level: "Intermediate", title: "Portfolio allocation", minutes: 5, xp: 60,
    summary: "How your money is split.",
    body: [
      "Allocation is the percentage of your portfolio in each asset, sector and in cash.",
      "Keeping some cash gives flexibility. Rebalancing means trimming winners that grew too large and topping up underweight areas.",
    ],
    example: "Target 20% per sector. After a rally, Technology is 35%. Rebalancing sells some tech and buys other sectors to return to target.",
    quiz: [
      { q: "Rebalancing usually means…", options: ["Selling some winners to restore targets", "Buying only the top stock", "Holding 100% cash"], answer: 0 },
      { q: "Allocation describes…", options: ["How money is split across holdings", "A company's revenue", "Order type"], answer: 0 },
    ],
  },
  {
    id: "technical-indicators", level: "Advanced", title: "Technical indicators", minutes: 7, xp: 90,
    summary: "Moving averages, RSI and momentum.",
    body: [
      "Technical indicators are calculations on price and volume. A moving average smooths price over N periods; price above its 50-day average is often called an uptrend.",
      "RSI (Relative Strength Index) ranges 0–100; readings above 70 are 'overbought', below 30 'oversold'. Indicators describe the past — they don't predict the future.",
    ],
    example: "A stock crosses above its 50-day moving average with rising volume. Some traders treat this as momentum confirmation, while still using a stop-loss.",
    quiz: [
      { q: "An RSI of 80 is commonly called…", options: ["Oversold", "Overbought", "Neutral"], answer: 1 },
      { q: "Indicators are based on…", options: ["Past price/volume data", "Guaranteed forecasts", "News only"], answer: 0 },
    ],
  },
  {
    id: "fundamental-analysis", level: "Advanced", title: "Fundamental analysis", minutes: 7, xp: 90,
    summary: "Valuing the business behind the stock.",
    body: [
      "Fundamental analysis studies revenue, profits, debt and growth to estimate a company's worth.",
      "P/E ratio = price ÷ earnings per share. A high P/E means investors pay more per rupee of earnings, often expecting growth.",
    ],
    example: "Price ₹600, EPS ₹30 → P/E of 20. A peer with similar growth at P/E 12 may look cheaper — or may have hidden risks.",
    quiz: [
      { q: "Price ₹500, EPS ₹25. P/E?", options: ["5", "20", "25"], answer: 1 },
      { q: "Fundamental analysis focuses on…", options: ["Chart patterns", "Business financials", "Order types"], answer: 1 },
    ],
  },
  {
    id: "drawdowns", level: "Advanced", title: "Drawdowns", minutes: 6, xp: 80,
    summary: "Peak-to-trough declines.",
    body: [
      "Drawdown is the fall from a portfolio's peak to its lowest point before a new peak. Maximum drawdown is the worst such fall.",
      "Recovery is asymmetric: a 50% loss needs a 100% gain to break even.",
    ],
    example: "Portfolio peaks at ₹6,00,000, falls to ₹4,80,000 — a 20% drawdown. It needs +25% to recover.",
    quiz: [
      { q: "After a 50% loss, gain needed to recover?", options: ["50%", "100%", "25%"], answer: 1 },
      { q: "Drawdown is measured from…", options: ["Starting balance", "The previous peak", "Today's open"], answer: 1 },
    ],
  },
  {
    id: "risk-adjusted-returns", level: "Advanced", title: "Risk-adjusted returns", minutes: 7, xp: 90,
    summary: "Return per unit of risk.",
    body: [
      "Two portfolios with 15% returns aren't equal if one swung wildly. Risk-adjusted measures like the Sharpe ratio divide excess return by volatility.",
      "TradeQuest leaderboards emphasise return % and risk-adjusted results, not absolute virtual money.",
    ],
    example: "Portfolio A: 12% return, 8% volatility. Portfolio B: 15% return, 25% volatility. A has the better risk-adjusted performance.",
    quiz: [
      { q: "Sharpe ratio divides excess return by…", options: ["Volatility", "Price", "Number of trades"], answer: 0 },
      { q: "Higher return always means better risk-adjusted return.", options: ["True", "False"], answer: 1 },
    ],
  },
  {
    id: "backtesting", level: "Advanced", title: "Backtesting concepts", minutes: 6, xp: 80,
    summary: "Testing strategies on past data.",
    body: [
      "Backtesting applies a strategy's rules to historical data to see how it would have performed.",
      "Beware overfitting — tuning rules so tightly to the past that they fail in the future — and look-ahead bias, where the test uses information that wasn't available at the time.",
    ],
    example: "A rule 'buy when price crosses above the 20-day average' tested on 5 years of data shows +40%. Testing on a separate period checks whether it generalises.",
    quiz: [
      { q: "Overfitting means…", options: ["A strategy too tailored to past data", "Using too little data", "Trading too slowly"], answer: 0 },
      { q: "Look-ahead bias uses…", options: ["Only past data", "Information not available at the time", "Live prices"], answer: 1 },
    ],
  },
];

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);
export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

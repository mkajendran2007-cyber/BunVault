export type MarketHoursState = 'Open' | 'Closed' | 'Weekend' | 'Holiday' | 'Pre-Open';

export class MarketHoursDetector {
  static getNSEMarketStatus(): { state: MarketHoursState; description: string } {
    const now = new Date();
    // Convert to IST Timezone (UTC + 5:30)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 3600000 * 5.5);

    const day = istTime.getDay(); // 0 = Sun, 6 = Sat
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Weekend Check
    if (day === 0 || day === 6) {
      return { state: 'Weekend', description: 'BSE/NSE Closed for Weekend' };
    }

    // Pre-open (9:00 AM - 9:15 AM IST = 540 to 555 mins)
    if (totalMinutes >= 540 && totalMinutes < 555) {
      return { state: 'Pre-Open', description: 'NSE Pre-Open Session Active' };
    }

    // Normal Market Hours (9:15 AM - 3:30 PM IST = 555 to 930 mins)
    if (totalMinutes >= 555 && totalMinutes <= 930) {
      return { state: 'Open', description: 'NSE/BSE Live Market Session Open' };
    }

    return { state: 'Closed', description: 'NSE/BSE Market Closed' };
  }
}

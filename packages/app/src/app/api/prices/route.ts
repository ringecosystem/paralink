import { NextResponse } from 'next/server';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const url = `${COINGECKO_API_URL}?ids=${ids}&vs_currencies=usd`;
    console.log('url', url);
    const response = await fetch(url, {
      headers: {
        x_cg_pro_api_key: process.env.CMC_API_KEY!,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

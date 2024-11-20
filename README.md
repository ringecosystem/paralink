# ParaLink
ParaLink is an asset exchange hub integrated with [XCM](https://wiki.polkadot.network/docs/learn/xcm/overview-summary) within the Polkadot parachains. It automatically supports parachains and assets, so if you are part of a parachain or token team, no additional action is required. Your parachain and its assets will be supported by ParaLink, simplifying the integration process and enhancing the efficiency of asset exchanges.

ParaLink will automatically support chains that meet the following criteria:

1. The parachain is connected to another parachain via [HRMP](https://wiki.polkadot.network/docs/build-hrmp-channels), and the channel is active.
2. The parachain supports XCM, and the `XcmPaymentRuntimeApi` is available. For more details, refer to [this guide](https://github.com/paritytech/polkadot-sdk/pull/3607).

Assets within your parachains will be automatically supported if they meet the following requirement:

1. The asset is listed in the [asset-transfer-api-registry](https://github.com/paritytech/asset-transfer-api-registry), which we use to obtain asset registry details.

As long as your parachain and assets meet these requirements, they will be automatically supported by ParaLink. Enjoy the seamless integration!


# Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Viem v2
- Wagmi v2

## Prerequisites

- Node.js 18+
- pnpm 8+

## Installation

1. Clone the repository

```bash
git clone https://github.com/ringecosystem/paralink.git
cd paralink
```

2. Initialize submodules

```bash
git submodule update --init --recursive
```

3. Install dependencies

```bash
pnpm install
```

## Development

Start the development server:

```bash
pnpm run dev
```

### Production

1. Build for production:

```bash
pnpm run build
```

2. Start production server:

```bash
pnpm start
```

# ParaLink
ParaLink is an asset exchange hub based on [XCM](https://wiki.polkadot.network/docs/learn/xcm/overview-summary) within Polkadot parachains. Unlike other exchange tools, it automatically supports parachains and assets that meet the [Support Requirements](#support-requirements). Once these requirements are met, your parachain and its assets are supported by ParaLink with no manual intervention, significantly simplifying integration and enhancing asset exchange efficiency for the Polkadot community.

## **Support Requirements**

ParaLink will automatically support chains that meet the following criteria:

1. The parachain is connected to another parachain via [HRMP](https://wiki.polkadot.network/docs/build-hrmp-channels), and the channel is active.
2. The parachain supports XCM, and the `XcmPaymentRuntimeApi` is available. For more details, refer to [this guide](https://github.com/paritytech/polkadot-sdk/pull/3607).

Assets within your parachains will be automatically supported if they meet the following requirement:

1. The asset is listed in the [asset-transfer-api-registry](https://github.com/paritytech/asset-transfer-api-registry), which we use to obtain asset registry details.
2. The asset should be included in the target chain’s `xcmPaymentAcceptTokens` list.

As long as your parachain and assets meet these requirements, they will be automatically supported by ParaLink. Enjoy the seamless integration!

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Viem v2
- Wagmi v2

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

1. Clone the repository

```bash
git clone https://github.com/ringecosystem/paralink.git
cd paralink
```

2. Install dependencies

```bash
pnpm install
```

### Development

#### UI Commands

Start the development server for the UI:

```bash
pnpm run dev:ui
```

#### Builder Commands

Here are some common Builder command line examples:

1. **Run the Builder**:

```bash
pnpm run dev:builder
```

### Production

1. Build for production:

```bash
pnpm run build:ui
```

2. Start production server:

```bash
pnpm run start:ui
```

### Additional Builder Commands

1. **Build the project**:

```bash
pnpm run build:builder
```

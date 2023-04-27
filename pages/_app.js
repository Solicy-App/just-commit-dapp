import '../styles/globals.css'
import "@rainbow-me/rainbowkit/styles.css"
import { Analytics } from '@vercel/analytics/react';
import { getDefaultWallets, RainbowKitProvider, lightTheme as lightThemeRainbowkit } from '@rainbow-me/rainbowkit'
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { ThemeProvider } from 'styled-components'
import { ThorinGlobalStyles, lightTheme as lightThemeENS } from '@ensdomains/thorin'
import PullToRefresh from 'react-simple-pull-to-refresh';

const { chains, provider } = configureChains(
  // [chain.polygon, chain.mainnet], // to ENS reverse resolve

  //[chain.polygon], // APP or BETA
  [chain.polygonMumbai], // DEV

  [infuraProvider({}), publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: "Just Commit dApp",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const App = ({ Component, pageProps }) => {
  return (
    <PullToRefresh
      onRefresh={() => {
        try {
          return location.reload();
        } catch (error) {
          return;
        }
      }}
    >
      <ThemeProvider theme={lightThemeENS}>
        <ThorinGlobalStyles />
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider
            chains={chains}
            theme={lightThemeRainbowkit({
              accentColor: "#1DD297",
            })}
          >
            <Component {...pageProps} />
            <Analytics />
          </RainbowKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </PullToRefresh>
  );
};

export default App;

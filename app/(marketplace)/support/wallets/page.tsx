"use client"

import { useCallback, useEffect, useState } from "react"
import { manifest } from "@/manifests/manifests"
import { marketplaceChain } from "@/providers/authentication/marketplaceWagmiChain"
import { useCurrentCollectionContext } from "@/providers/currentCollection/currentCollectionContext"
import { useSearchAssets } from "@/services/cometh-marketplace/searchAssetsService"
import { comethConnectConnector } from "@cometh/connect-sdk-viem"
import { useQueryClient } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import {
  createConfig,
  http,
  useAccount,
  useConnect,
  useDisconnect,
  WagmiProvider,
} from "wagmi"

import { env } from "@/config/env"
// import globalConfig from "@/config/globalConfig"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { AccountBalance } from "@/components/account-dropdown/AccountBalance"
// import ERC20TransferButton from "@/components/activities/account/ERC20TransferButton"
import { TransferAssetButton } from "@/components/asset-actions/buttons/TransferAssetButton"

const COMETH_PASSKEY_PREFIX = "cometh-connect-"
const COMETH_BRUNER_PREFIX = "cometh-connect-fallback-"

type LocalStorageWallets = {
  burnerWallets: string[]
  passkeyWallets: string[]
}

const getLocalStorageWallets = (): LocalStorageWallets => {
  const burnerWallets = []
  const passkeyWallets = []
  for (var i = 0, len = localStorage.length; i < len; ++i) {
    const key = localStorage.key(i)
    if (key?.startsWith(COMETH_BRUNER_PREFIX)) {
      const keySplit = key.split(COMETH_BRUNER_PREFIX)
      if (keySplit.length > 1) {
        burnerWallets.push(keySplit[1])
      }
    } else if (key?.startsWith(COMETH_PASSKEY_PREFIX)) {
      const keySplit = key.split(COMETH_PASSKEY_PREFIX)
      if (keySplit.length > 1) {
        passkeyWallets.push(keySplit[1])
      }
    }
  }

  return { burnerWallets, passkeyWallets }
}

const WalletAssetTransfer = () => {
  const account = useAccount()
  const { currentCollectionAddress } = useCurrentCollectionContext()
  const client = useQueryClient()

  const { data: searchResult } = useSearchAssets({
    contractAddress: currentCollectionAddress,
    owner: account?.address,
    limit: 9999,
  })
  const assets = searchResult?.assets

  const refreshAssets = useCallback(() => {
    client.invalidateQueries({ queryKey: ["assets", "search"] })
  }, [client])
  if (!account?.isConnected) return null

  return (
    <div className="card-primary p-5">
      <div className="mb-3 text-xl font-bold">Connected wallet</div>
      <div className="text-base">Connected to {account.address}</div>
      <div className="text-base">
        Current collection address: {currentCollectionAddress}
      </div>
      <hr className="my-4" />
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xl font-bold">Assets</div>
          <Button size="sm" variant="tertiary" onClick={refreshAssets}>
            <RotateCcw size={16} />
          </Button>
        </div>
        <ul>
          {assets?.map((asset: any) => (
            <li className="flex items-center" key={asset.tokenId}>
              {asset.tokenId} -&nbsp;<b>{asset.metadata.name}</b>
              <TransferAssetButton asset={asset} verifyAddress={false} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-1 mt-3">
        <div className="mb-1 text-xl font-bold">ERC20 (funds)</div>
        <div className="mb-1">Your Current Balance</div>
        <AccountBalance hideFillWallet={true} />
      </div>
      {/* <div className="mt-3 flex gap-3">
        <div>
          <ERC20TransferButton
            tokenSymbol={globalConfig.network.nativeToken.symbol}
            decimalNumber={globalConfig.network.nativeToken.decimals}
          />
        </div>
        <div>
          <ERC20TransferButton
            tokenAddress={globalConfig.network.wrappedNativeToken.address}
            tokenSymbol={globalConfig.network.wrappedNativeToken.symbol}
            decimalNumber={globalConfig.network.nativeToken.decimals}
          />
        </div>
        {!globalConfig.useNativeForOrders && (
          <div>
            <ERC20TransferButton
              tokenAddress={globalConfig.ordersErc20.address}
              tokenSymbol={globalConfig.ordersErc20.symbol}
              decimalNumber={globalConfig.ordersErc20.decimals}
            />
          </div>
        )}
      </div> */}
    </div>
  )
}

const WalletDebugPanels = () => {
  const [localStorageWallets, setLocalStorageWallets] =
    useState<LocalStorageWallets>({
      burnerWallets: [],
      passkeyWallets: [],
    })
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const { disconnect } = useDisconnect()
  const account = useAccount()
  const { connect, error, isPending } = useConnect()

  useEffect(() => {
    setLocalStorageWallets(getLocalStorageWallets())
  }, [])

  const refresh = useCallback(() => {
    setLocalStorageWallets(getLocalStorageWallets())
  }, [])

  const logInSpecificWallet = useCallback(() => {
    if (account?.isConnected) {
      disconnect()
    }
    if (!env.NEXT_PUBLIC_COMETH_CONNECT_API_KEY) {
      return
    }
    const connector = comethConnectConnector({
      apiKey: env.NEXT_PUBLIC_COMETH_CONNECT_API_KEY,
      walletAddress: newWalletAddress,
    })
    connect({ connector: connector as any })
  }, [newWalletAddress, disconnect, connect, account?.isConnected])

  return (
    <div className="container mx-auto flex w-full max-w-[880px] flex-col gap-4 py-4 max-sm:pt-4">
      <div className="card-primary p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xl font-bold">
            Cometh Wallets stored in your local storage
          </div>
          <Button size="sm" variant="tertiary" onClick={refresh}>
            <RotateCcw size={16} />
          </Button>
        </div>
        <div className="mt-5 text-lg font-bold">Passkey Wallets</div>
        <ul>
          {localStorageWallets.passkeyWallets.length === 0 ? (
            <div>No passkey wallet</div>
          ) : (
            localStorageWallets.passkeyWallets.map((wallet) => (
              <li key={wallet}>{wallet}</li>
            ))
          )}
        </ul>
        <div className="mt-3 text-lg font-bold">Burner Wallets</div>
        <ul>
          {localStorageWallets.burnerWallets.length === 0 ? (
            <li>No burner wallet</li>
          ) : (
            localStorageWallets.burnerWallets.map((wallet) => (
              <li key={wallet}>{wallet}</li>
            ))
          )}
        </ul>
      </div>
      <div className="card-primary p-5">
        <div className="mb-3 text-xl font-bold">Change connected wallet</div>
        <div className="mb-2">
          Logged wallet on this page is different from the wallet connected on
          the site header and the rest of the site.
        </div>
        <div className="flex items-stretch gap-2">
          <Input
            className="grow"
            inputUpdateCallback={setNewWalletAddress}
          ></Input>
          <Button
            size="lg"
            className="ml-3"
            onClick={logInSpecificWallet}
            disabled={isPending}
          >
            Cometh connect log into wallet
          </Button>
        </div>
        <div className="mt-2">
          {isPending ? "Connecting..." : ""}
          {error ? error.message : ""}
        </div>
      </div>
      <WalletAssetTransfer />
    </div>
  )
}

const wagmiConfig = createConfig({
  chains: [marketplaceChain] as any,
  transports: {
    [marketplaceChain.id]: http(manifest.rpcUrl),
  },
  ssr: true,
})

export default function ComethWalletsPage() {
  return (
    <div>
      <WagmiProvider config={wagmiConfig}>
        <WalletDebugPanels />
      </WagmiProvider>
    </div>
  )
}

import { useUsername } from "@/services/user/userNameService"
import { AssetWithTradeData } from "@cometh/marketplace-sdk"
import { Address } from "viem"

import { UserLink } from "@/components/ui/user/UserButton"
import { AuthenticationButton }  from "@/components/AuthentificationButton"
import { AssetStatusBadge } from "@/components/marketplace/asset/"
import {
  ProductBlockCenteredColumn,
  ProductBlockContainer,
  ProductBlockDividedColumn,
  ProductBlockLabel,
} from "@/components/ProductBlock"

import { MakeBuyOfferButton } from "../buttons/MakeBuyOfferPriceDialog"
import { SwitchNetwork } from "../buttons/SwitchNetwork"
import { BestOfferColumn } from "./columns/BestOfferColumn"

export type NotListedProductBlockProps = {
  asset: AssetWithTradeData
}

export function NotListedProductBlock({ asset }: NotListedProductBlockProps) {
  const { username, isFetchingUsername } = useUsername(asset.owner as Address)

  return (
    <ProductBlockContainer>
      <ProductBlockDividedColumn>
        <ProductBlockLabel>Price</ProductBlockLabel>
        <AssetStatusBadge status="not-listed" />
      </ProductBlockDividedColumn>

      <BestOfferColumn asset={asset} />

      <ProductBlockDividedColumn>
        <ProductBlockLabel>Owned by</ProductBlockLabel>
        {!isFetchingUsername && (
          <UserLink
            variant="link"
            className="mt-0.5"
            user={{ address: asset.owner as Address, username: username }}
          />
        )}
      </ProductBlockDividedColumn>

      <ProductBlockCenteredColumn>
        <ConnectButton customText="Login to make an offer" fullVariant>
          <SwitchNetwork>
            <MakeBuyOfferButton asset={asset} />
          </SwitchNetwork>
        </ConnectButton>
      </ProductBlockCenteredColumn>
    </ProductBlockContainer>
  )
}
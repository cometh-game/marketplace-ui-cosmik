"use client"

import { useMemo, useState } from "react"
import { useGetCollection } from "@/services/cometh-marketplace/collectionService"
import { useSearchFilledEvents } from "@/services/cometh-marketplace/searchFilledEventsService"
import { useSearchOrders } from "@/services/cometh-marketplace/searchOrdersService"
import { useUsernames } from "@/services/cosmik/userService"
import {
  CollectionStandard,
  FilterDirection,
  SearchOrdersRequest,
  SearchOrdersSortOption,
  TradeStatus,
} from "@cometh/marketplace-sdk"
import { ArrowLeftIcon } from "lucide-react"
import { Address } from "viem"

import { TradeActivitiesTable } from "@/components/trade-activities/TradeActivitiesTable"

import { Button } from "../ui/Button"
import { Link } from "../ui/Link"
import { Loading } from "../ui/Loading"
import { ActivitiesFiltersControls } from "./ActivitiesFiltersControls"

type CollectionActivitiesProps = {
  contractAddress: string
}

const NB_COLLECTION_ORDERS_SHOWN = 300

export const CollectionActivities = ({
  contractAddress,
}: CollectionActivitiesProps) => {
  const [filtersOverride, setFiltersOverride] = useState<
    Partial<SearchOrdersRequest>
  >({})

  // Hack until activities have a dedicated endpoint
  const hackedFiltersOverride = useMemo(() => {
    const hackedFiltersOverride = { ...filtersOverride }
    if (hackedFiltersOverride.statuses) {
      hackedFiltersOverride.statuses = hackedFiltersOverride.statuses.filter(
        (status) => status !== TradeStatus.FILLED
      )
    }
    return hackedFiltersOverride
  }, [filtersOverride])

  const { data: orderSearch, isPending: isPendingOrders } = useSearchOrders(
    {
      tokenAddress: contractAddress,
      limit: NB_COLLECTION_ORDERS_SHOWN,
      orderBy: SearchOrdersSortOption.UPDATED_AT,
      orderByDirection: FilterDirection.DESC,
      ...hackedFiltersOverride,
    },
    filtersOverride?.statuses?.includes(TradeStatus.FILLED) &&
      filtersOverride?.statuses?.length === 1
  )

  const { data: filledEventsSearch, isPending: isPendingFilledEvents } =
    useSearchFilledEvents(
      {
        tokenAddress: contractAddress,
        limit: NB_COLLECTION_ORDERS_SHOWN,
      },
      !filtersOverride?.statuses?.includes(TradeStatus.FILLED) &&
        filtersOverride?.statuses?.length !== 0
    )
  const { data: collection } = useGetCollection(contractAddress as Address)

  const wallets = useMemo(() => {
    const makers = orderSearch?.orders.map((order) => order.maker) ?? []
    const takers = orderSearch?.orders.map((order) => order.taker) ?? []
    const filledMakers =
      filledEventsSearch?.filledEvents.map((event) => event.maker) ?? []
    const filledTakers =
      filledEventsSearch?.filledEvents.map((event) => event.taker) ?? []
    return [
      ...new Set([...makers, ...takers, ...filledMakers, ...filledTakers]),
    ]
  }, [orderSearch, filledEventsSearch])

  const { usernames, isFetchingUsernames } = useUsernames(wallets as Address[])

  const ordersWithUsernames = orderSearch?.orders.map((order) => {
    return {
      ...order,
      makerUsername: usernames[order.maker],
      takerUsername: usernames[order.taker],
    }
  })

  const eventsWithUsernames = filledEventsSearch?.filledEvents.map((event) => {
    return {
      ...event,
      makerUsername: usernames[event.maker],
      takerUsername: usernames[event.taker],
    }
  })
  const isPending =
    isPendingOrders || isPendingFilledEvents || isFetchingUsernames

  return (
    <div className="w-full">
      <div className="mb-3">
        <Link href={`/nfts`}>
          <Button variant="secondary" className="gap-1">
            <ArrowLeftIcon size="16" />
            Back to marketplace
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h1 className="mb-2 inline-flex items-center text-2xl font-medium sm:text-3xl">
          Activities for collection{" "}
          <span className="ml-2 font-bold">
            {collection?.name ? <>&quot;{collection?.name}&quot;</> : "..."}
          </span>
        </h1>
        <ActivitiesFiltersControls
          onFiltersOverrideChange={setFiltersOverride}
        />
      </div>
      {isPending ? (
        <Loading />
      ) : (
        <>
          <div className="mb-7 mt-3 w-full text-left">
            {orderSearch?.total}{" "}
            {orderSearch && orderSearch.total > 1 ? "orders" : "order"} found
          </div>
          <TradeActivitiesTable
            orders={ordersWithUsernames}
            orderFilledEvents={eventsWithUsernames}
            display1155Columns={
              collection?.standard === CollectionStandard.ERC1155
            }
            maxTransfersToShow={NB_COLLECTION_ORDERS_SHOWN}
            displayAssetColumns={true}
          />
        </>
      )}
    </div>
  )
}
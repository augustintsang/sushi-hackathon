'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

// Simulating a backend service for real-time updates
const simulateBackend = (() => {
  let auctions: { 
    [key: string]: { 
      currentBid: number; 
      highestBidder: string; 
      itemName: string;
      itemImage: string;
      startTime: number;
      endTime: number | null;
    } 
  } = {}
  const listeners: { [key: string]: ((auction: typeof auctions[string]) => void)[] } = {}

  return {
    createAuction: (auctionId: string, itemName: string, startingPrice: number, itemImage: string) => {
      auctions[auctionId] = { 
        currentBid: startingPrice, 
        highestBidder: 'Auctioneer', 
        itemName, 
        itemImage,
        startTime: Date.now(),
        endTime: null
      }
      listeners[auctionId] = []
    },
    placeBid: (auctionId: string, amount: number, bidder: string) => {
      if (auctions[auctionId] && amount > auctions[auctionId].currentBid) {
        auctions[auctionId].currentBid = amount
        auctions[auctionId].highestBidder = bidder
        listeners[auctionId].forEach(listener => listener(auctions[auctionId]))
      }
    },
    getAuctionDetails: (auctionId: string) => auctions[auctionId],
    getAllAuctions: () => auctions,
    endAuction: (auctionId: string) => {
      if (auctions[auctionId]) {
        auctions[auctionId].endTime = Date.now()
        listeners[auctionId].forEach(listener => listener(auctions[auctionId]))
      }
    },
    subscribe: (auctionId: string, listener: (auction: typeof auctions[string]) => void) => {
      if (!listeners[auctionId]) listeners[auctionId] = []
      listeners[auctionId].push(listener)
      return () => {
        const index = listeners[auctionId].indexOf(listener)
        if (index > -1) listeners[auctionId].splice(index, 1)
      }
    }
  }
})()

export default function EnhancedAuctionPlatform() {
  const [activeTab, setActiveTab] = useState('create')
  const [itemName, setItemName] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [itemImage, setItemImage] = useState('')
  const [auctionId, setAuctionId] = useState('')
  const [currentBid, setCurrentBid] = useState(0)
  const [highestBidder, setHighestBidder] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [bidderName, setBidderName] = useState('')
  const [auctionCreated, setAuctionCreated] = useState(false)
  const [joinedAuction, setJoinedAuction] = useState(false)
  const [allAuctions, setAllAuctions] = useState<ReturnType<typeof simulateBackend.getAllAuctions>>({})

  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const id = searchParams.get('id')

  useEffect(() => {
    if (mode === 'join' && id) {
      setAuctionId(id)
      joinAuction(id)
    } else if (mode === 'auctioneer') {
      setActiveTab('auctioneer')
      updateAuctioneerDashboard()
    }
  }, [mode, id])

  const createAuction = () => {
    const newAuctionId = Math.random().toString(36).substr(2, 9)
    simulateBackend.createAuction(newAuctionId, itemName, Number(startingPrice), itemImage)
    setAuctionId(newAuctionId)
    setAuctionCreated(true)
    updateAuctioneerDashboard()
  }

  const joinAuction = (id: string) => {
    const auctionDetails = simulateBackend.getAuctionDetails(id)
    if (auctionDetails) {
      setItemName(auctionDetails.itemName)
      setCurrentBid(auctionDetails.currentBid)
      setHighestBidder(auctionDetails.highestBidder)
      setItemImage(auctionDetails.itemImage)
      setJoinedAuction(true)

      const unsubscribe = simulateBackend.subscribe(id, (auction) => {
        setCurrentBid(auction.currentBid)
        setHighestBidder(auction.highestBidder)
      })

      return () => unsubscribe()
    }
  }

  const placeBid = () => {
    const bidValue = Number(bidAmount)
    if (bidValue > currentBid) {
      simulateBackend.placeBid(auctionId, bidValue, bidderName)
      setBidAmount('')
    }
  }

  const updateAuctioneerDashboard = () => {
    setAllAuctions(simulateBackend.getAllAuctions())
  }

  const endAuction = (id: string) => {
    simulateBackend.endAuction(id)
    updateAuctioneerDashboard()
  }

  if (joinedAuction) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{itemName}</CardTitle>
          <CardDescription>Current highest bid: ${currentBid} by {highestBidder}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-square">
              <Image
                src={itemImage || "/placeholder.svg"}
                alt={itemName}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bidderName">Your Name</Label>
                <Input
                  id="bidderName"
                  placeholder="Your Name"
                  value={bidderName}
                  onChange={(e) => setBidderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bidAmount">Your Bid</Label>
                <Input
                  id="bidAmount"
                  placeholder="Your Bid"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
              </div>
              <Button onClick={placeBid} disabled={!bidderName || !bidAmount || Number(bidAmount) <= currentBid}>
                Place Bid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Enhanced Auction Platform</CardTitle>
        <CardDescription>Create, join an auction, or manage as an auctioneer</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Auction</TabsTrigger>
            <TabsTrigger value="join">Join Auction</TabsTrigger>
            <TabsTrigger value="auctioneer">Auctioneer Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="Item Name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startingPrice">Starting Price</Label>
                <Input
                  id="startingPrice"
                  placeholder="Starting Price"
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemImage">Item Image URL</Label>
                <Input
                  id="itemImage"
                  placeholder="Item Image URL"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                />
              </div>
              <Button onClick={createAuction} disabled={!itemName || !startingPrice || !itemImage}>
                Create Auction
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="join">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auctionId">Auction ID</Label>
                <Input
                  id="auctionId"
                  placeholder="Auction ID"
                  value={auctionId}
                  onChange={(e) => setAuctionId(e.target.value)}
                />
              </div>
              <Button onClick={() => joinAuction(auctionId)} disabled={!auctionId}>
                Join Auction
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="auctioneer">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Active Auctions</h3>
              {Object.entries(allAuctions).map(([id, auction]) => (
                <Card key={id}>
                  <CardHeader>
                    <CardTitle>{auction.itemName}</CardTitle>
                    <CardDescription>Current bid: ${auction.currentBid} by {auction.highestBidder}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative aspect-square">
                        <Image
                          src={auction.itemImage || "/placeholder.svg"}
                          alt={auction.itemName}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                      </div>
                      <div className="flex flex-col justify-center space-y-2">
                        <p>Start time: {new Date(auction.startTime).toLocaleString()}</p>
                        {auction.endTime ? (
                          <p>End time: {new Date(auction.endTime).toLocaleString()}</p>
                        ) : (
                          <Button onClick={() => endAuction(id)}>End Auction</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CardContent>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      {auctionCreated && (
        <CardFooter>
          <div className="w-full space-y-2">
            <p>Share this link with participants:</p>
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auction?mode=join&id=${auctionId}`}
              readOnly
            />
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
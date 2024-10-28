import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create a new auction
async function createAuction(event) {
    event.preventDefault();

    const name = document.getElementById('auction-name').value;
    const description = document.getElementById('auction-description').value;
    const startingPrice = parseFloat(document.getElementById('starting-price').value);

    const placeholderSellerId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
        .from('auctions')
        .insert([{
            title: name,
            description: description,
            seller_id: placeholderSellerId,
            starting_price: startingPrice,
            current_price: startingPrice,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }]);

    if (error) {
        console.error('Error creating auction:', error);
        alert('Failed to create auction.');
    } else {
        alert('Auction created successfully!');
        document.getElementById('auction-form').reset();
    }
}

// Function to place a bid
async function placeBid(event) {
    event.preventDefault();

    const auctionId = document.getElementById('auction-id').value;
    const bidAmount = parseFloat(document.getElementById('bid-amount').value);

    if (!auctionId) {
        alert('Please enter a valid auction ID.');
        return;
    }

    const { data, error } = await supabase.rpc('validate_and_update_bid', {
        auction_id: auctionId,
        bid_amount: bidAmount,
        bidder_id: '00000000-0000-0000-0000-000000000000'
    });

    if (error) {
        console.error('Error placing bid:', error);
        alert('Failed to place bid.');
    } else if (!data) {
        alert('Bid must be higher than the current price.');
    } else {
        alert('Bid placed successfully!');
        document.getElementById('bid-form').reset();
    }
}

// Attach event listeners
document.getElementById('auction-form').addEventListener('submit', createAuction);
document.getElementById('bid-form').addEventListener('submit', placeBid);

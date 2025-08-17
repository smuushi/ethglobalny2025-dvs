module nft::nft {
	use sui::object::{Self, UID, ID};
	use sui::tx_context::{Self, TxContext};
	use sui::transfer;
	use std::string::{Self, String};
	use std::vector;

	/// NFT struct with game metadata and ownership history
	public struct NFT has key, store {
		id: UID,
		game_id: ID,
		title: String,
		description: String,
		price: u64,
		publisher: address,
		walrus_blob_id: String,
		cover_image_blob_id: String,
		genre: String,
		publish_date: u64,
		owners: vector<address>, // history of all owners
		mint_date: u64,
	}

	/// Mint a new NFT with game metadata, initial owner is sender
	public fun mint_nft(
		game_id: ID,
		title: vector<u8>,
		description: vector<u8>,
		price: u64,
		publisher: address,
		walrus_blob_id: vector<u8>,
		cover_image_blob_id: vector<u8>,
		genre: vector<u8>,
		publish_date: u64,
		ctx: &mut TxContext
	): NFT {
		let owners = vector::empty<address>();
		let sender = tx_context::sender(ctx);
		vector::push_back(&mut owners, sender);
		NFT {
			id: object::new(ctx),
			game_id,
			title: string::utf8(title),
			description: string::utf8(description),
			price,
			publisher,
			walrus_blob_id: string::utf8(walrus_blob_id),
			cover_image_blob_id: string::utf8(cover_image_blob_id),
			genre: string::utf8(genre),
			publish_date,
			owners,
			mint_date: tx_context::epoch(ctx),
		}
	}

	/// Transfer NFT to new owner and update owners history
	public fun transfer_nft(nft: &mut NFT, to: address) {
		vector::push_back(&mut nft.owners, to);
		transfer::public_transfer(nft, to);
	}

	/// Get NFT metadata and ownership history
	public fun get_nft_info(nft: &NFT): (ID, String, String, u64, address, String, String, String, u64, vector<address>, u64) {
		(
			nft.game_id,
			nft.title,
			nft.description,
			nft.price,
			nft.publisher,
			nft.walrus_blob_id,
			nft.cover_image_blob_id,
			nft.genre,
			nft.publish_date,
			nft.owners,
			nft.mint_date
		)
	}
}

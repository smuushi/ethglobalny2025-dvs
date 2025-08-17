module nft::nft {
	use sui::object::{UID, ID};
	use sui::tx_context::{TxContext};
	use sui::transfer;
	use sui::event;
	use std::string::{Self, String};

	const ENotOwner: u64 = 0;

	/// Game NFT representing ownership of a digital game with Seal integration
	public struct GameNFT has key, store {
		id: UID,
		game_id: ID,
		title: String,
		description: String,
		price: u64,
		publisher: address,
		walrus_blob_id: String,
		seal_policy_id: String,
		cover_image_blob_id: String,
		genre: String,
		publish_date: u64,
		owners: vector<address>,
		mint_date: u64,
		current_owner: address,
	}

	/// Event emitted when NFT is transferred
	public struct NFTTransferred has copy, drop {
		nft_id: ID,
		from: address,
		to: address,
		game_id: ID,
		timestamp: u64,
	}

	/// Mint a new Game NFT when user purchases a game
	public fun mint_game_nft(
		game_id: ID,
		title: vector<u8>,
		description: vector<u8>,
		price: u64,
		publisher: address,
		walrus_blob_id: vector<u8>,
		seal_policy_id: vector<u8>,
		cover_image_blob_id: vector<u8>,
		genre: vector<u8>,
		publish_date: u64,
		ctx: &mut TxContext
	): GameNFT {
		let mut owners = std::vector::empty<address>();
		let sender = tx_context::sender(ctx);
		std::vector::push_back(&mut owners, sender);
		
		GameNFT {
			id: object::new(ctx),
			game_id,
			title: string::utf8(title),
			description: string::utf8(description),
			price,
			publisher,
			walrus_blob_id: string::utf8(walrus_blob_id),
			seal_policy_id: string::utf8(seal_policy_id),
			cover_image_blob_id: string::utf8(cover_image_blob_id),
			genre: string::utf8(genre),
			publish_date,
			owners,
			mint_date: tx_context::epoch(ctx),
			current_owner: sender,
		}
	}

	/// Transfer Game NFT to new owner and update ownership history
	public fun transfer_game_nft(nft: GameNFT, to: address, ctx: &TxContext) {
		let old_owner = nft.current_owner;
		let nft_id = object::id(&nft);
		let game_id = nft.game_id;
		
		event::emit(NFTTransferred {
			nft_id,
			from: old_owner,
			to,
			game_id,
			timestamp: tx_context::epoch(ctx),
		});
		
		transfer::public_transfer(nft, to);
	}

	/// Entry function to transfer NFT with ownership update
	public entry fun transfer_nft_with_history(nft: &mut GameNFT, to: address, ctx: &TxContext) {
		assert!(nft.current_owner == tx_context::sender(ctx), ENotOwner);
		std::vector::push_back(&mut nft.owners, to);
		nft.current_owner = to;
	}

	/// Verify game ownership for Seal token-gated access
	public fun verify_game_ownership(
		nft: &GameNFT,
		game_id: ID,
		owner: address
	): bool {
		nft.game_id == game_id && nft.current_owner == owner
	}

	/// Get NFT metadata and ownership info for Seal integration
	public fun get_nft_info(nft: &GameNFT): (ID, String, String, u64, address, String, String, String, String, u64, vector<address>, u64, address) {
		(
			nft.game_id,
			nft.title,
			nft.description,
			nft.price,
			nft.publisher,
			nft.walrus_blob_id,
			nft.seal_policy_id,
			nft.cover_image_blob_id,
			nft.genre,
			nft.publish_date,
			nft.owners,
			nft.mint_date,
			nft.current_owner
		)
	}

	/// Get Seal policy ID for token-gated decryption
	public fun get_seal_policy_id(nft: &GameNFT): String {
		nft.seal_policy_id
	}

	/// Get Walrus blob ID for encrypted game file
	public fun get_walrus_blob_id(nft: &GameNFT): String {
		nft.walrus_blob_id
	}

	/// Check if address owns this specific game NFT
	public fun owns_game(nft: &GameNFT, address: address): bool {
		nft.current_owner == address
	}

	/// Get ownership history for transparency
	public fun get_ownership_history(nft: &GameNFT): vector<address> {
		nft.owners
	}
}

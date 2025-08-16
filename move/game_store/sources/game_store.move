module game_store::game_store {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    const EInsufficientPayment: u64 = 0;
    const EGameNotFound: u64 = 1;
    const ENotOwner: u64 = 2;
    const EGameNotActive: u64 = 3;

    public struct Game has key, store {
        id: UID,
        title: String,
        description: String,
        price: u64,
        publisher: address,
        walrus_blob_id: String,
        cover_image_blob_id: String,
        genre: String,
        publish_date: u64,
        is_active: bool,
        total_sales: u64,
    }

    public struct GameNFT has key, store {
        id: UID,
        game_id: ID,
        owner: address,
        purchase_date: u64,
    }

    public struct GameStore has key {
        id: UID,
        admin: address,
        games: vector<ID>,
        total_games: u64,
    }

    public struct GamePublished has copy, drop {
        game_id: ID,
        title: String,
        publisher: address,
        price: u64,
        walrus_blob_id: String,
    }

    public struct GamePurchased has copy, drop {
        game_id: ID,
        buyer: address,
        price: u64,
        nft_id: ID,
    }

    fun init(ctx: &mut TxContext) {
        let store = GameStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            games: vector::empty<ID>(),
            total_games: 0,
        };
        transfer::share_object(store);
    }

    public fun publish_game(
        store: &mut GameStore,
        title: vector<u8>,
        description: vector<u8>,
        price: u64,
        walrus_blob_id: vector<u8>,
        cover_image_blob_id: vector<u8>,
        genre: vector<u8>,
        ctx: &mut TxContext
    ): ID {
        let game = Game {
            id: object::new(ctx),
            title: string::utf8(title),
            description: string::utf8(description),
            price,
            publisher: tx_context::sender(ctx),
            walrus_blob_id: string::utf8(walrus_blob_id),
            cover_image_blob_id: string::utf8(cover_image_blob_id),
            genre: string::utf8(genre),
            publish_date: tx_context::epoch(ctx),
            is_active: true,
            total_sales: 0,
        };
        
        let game_id = object::id(&game);
        vector::push_back(&mut store.games, game_id);
        store.total_games = store.total_games + 1;

        event::emit(GamePublished {
            game_id,
            title: game.title,
            publisher: game.publisher,
            price: game.price,
            walrus_blob_id: game.walrus_blob_id,
        });

        transfer::share_object(game);
        game_id
    }

    public fun purchase_game(
        game: &mut Game,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): GameNFT {
        assert!(game.is_active, EGameNotActive);
        assert!(coin::value(&payment) >= game.price, EInsufficientPayment);
        
        transfer::public_transfer(payment, game.publisher);
        
        game.total_sales = game.total_sales + 1;
        
        let nft = GameNFT {
            id: object::new(ctx),
            game_id: object::id(game),
            owner: tx_context::sender(ctx),
            purchase_date: tx_context::epoch(ctx),
        };

        let nft_id = object::id(&nft);

        event::emit(GamePurchased {
            game_id: object::id(game),
            buyer: tx_context::sender(ctx),
            price: game.price,
            nft_id,
        });
        
        nft
    }

    public fun verify_game_ownership(
        nft: &GameNFT,
        game_id: ID,
        owner: address
    ): bool {
        nft.game_id == game_id && nft.owner == owner
    }

    public fun transfer_game_nft(nft: GameNFT, to: address) {
        transfer::public_transfer(nft, to);
    }

    public fun deactivate_game(game: &mut Game, ctx: &TxContext) {
        assert!(game.publisher == tx_context::sender(ctx), ENotOwner);
        game.is_active = false;
    }

    public fun update_game_price(
        game: &mut Game,
        new_price: u64,
        ctx: &TxContext
    ) {
        assert!(game.publisher == tx_context::sender(ctx), ENotOwner);
        game.price = new_price;
    }

    public fun get_game_info(game: &Game): (String, String, u64, address, String, String, bool, u64) {
        (
            game.title,
            game.description,
            game.price,
            game.publisher,
            game.walrus_blob_id,
            game.genre,
            game.is_active,
            game.total_sales
        )
    }

    public fun get_nft_info(nft: &GameNFT): (ID, address, u64) {
        (nft.game_id, nft.owner, nft.purchase_date)
    }

    public fun get_store_stats(store: &GameStore): (address, u64) {
        (store.admin, store.total_games)
    }
}
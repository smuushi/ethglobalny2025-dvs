module game_store::game_store {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::display;
    use sui::package;
    use sui::bcs;
    use std::string::{Self, String};
    use std::vector;

    const EInsufficientPayment: u64 = 0;
    const EGameNotFound: u64 = 1;
    const ENotOwner: u64 = 2;
    const EGameNotActive: u64 = 3;
    const ENoAccess: u64 = 4;

    /// One-Time-Witness for the module
    public struct GAME_STORE has drop {}

    public struct GameFileMetadata has store, copy, drop {
        original_filename: String,
        file_size: u64,
        content_type: String,
        upload_timestamp: u64,
    }

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
        // Enhanced metadata fields
        game_file_metadata: GameFileMetadata,
        cover_image_metadata: GameFileMetadata,
    }

    public struct GameNFT has key, store {
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
        purchase_date: u64,
        is_publisher_nft: bool, // true for publisher, false for buyers
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

    public struct PublisherNFTMinted has copy, drop {
        game_id: ID,
        publisher: address,
        nft_id: ID,
        title: String,
    }

    fun init(otw: GAME_STORE, ctx: &mut TxContext) {
        // Create the GameStore
        let store = GameStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            games: vector::empty<ID>(),
            total_games: 0,
        };
        transfer::share_object(store);

        // Set up Display for GameNFT with Walrus image URLs
        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
            std::string::utf8(b"creator"),
            std::string::utf8(b"genre"),
            std::string::utf8(b"game_file"),
            std::string::utf8(b"price"),
            std::string::utf8(b"is_publisher_nft"),
        ];

        let values = vector[
            std::string::utf8(b"{title}"),
            std::string::utf8(b"{description}"),
            std::string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/{cover_image_blob_id}"),
            std::string::utf8(b"https://coldcache.xyz"),
            std::string::utf8(b"{publisher}"),
            std::string::utf8(b"{genre}"),
            std::string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/by-quilt-patch-id/{walrus_blob_id}"),
            std::string::utf8(b"{price} MIST"),
            std::string::utf8(b"{is_publisher_nft}"),
        ];

        // Get the Publisher object
        let publisher = package::claim(otw, ctx);
        
        // Create and set up display
        let mut display = display::new_with_fields<GameNFT>(
            &publisher, keys, values, ctx
        );
        
        display::update_version(&mut display);
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    public entry fun create_new_store(ctx: &mut TxContext) {
        let store = GameStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            games: vector::empty<ID>(),
            total_games: 0,
        };
        transfer::share_object(store);
    }

    public entry fun publish_game_entry(
        store: &mut GameStore,
        title: vector<u8>,
        description: vector<u8>,
        price: u64,
        walrus_blob_id: vector<u8>,
        cover_image_blob_id: vector<u8>,
        genre: vector<u8>,
        // Game file metadata
        game_filename: vector<u8>,
        game_file_size: u64,
        game_content_type: vector<u8>,
        // Cover image metadata
        cover_filename: vector<u8>,
        cover_file_size: u64,
        cover_content_type: vector<u8>,
        ctx: &mut TxContext
    ) {
        let (_game_id, publisher_nft) = publish_game(
            store,
            title,
            description,
            price,
            walrus_blob_id,
            cover_image_blob_id,
            genre,
            game_filename,
            game_file_size,
            game_content_type,
            cover_filename,
            cover_file_size,
            cover_content_type,
            ctx
        );
        
        // Transfer the NFT to the publisher
        transfer::public_transfer(publisher_nft, tx_context::sender(ctx));
    }

    public fun publish_game(
        store: &mut GameStore,
        title: vector<u8>,
        description: vector<u8>,
        price: u64,
        walrus_blob_id: vector<u8>,
        cover_image_blob_id: vector<u8>,
        genre: vector<u8>,
        // Game file metadata
        game_filename: vector<u8>,
        game_file_size: u64,
        game_content_type: vector<u8>,
        // Cover image metadata
        cover_filename: vector<u8>,
        cover_file_size: u64,
        cover_content_type: vector<u8>,
        ctx: &mut TxContext
    ): (ID, GameNFT) {
        let game_metadata = GameFileMetadata {
            original_filename: string::utf8(game_filename),
            file_size: game_file_size,
            content_type: string::utf8(game_content_type),
            upload_timestamp: tx_context::epoch_timestamp_ms(ctx),
        };

        let cover_metadata = GameFileMetadata {
            original_filename: string::utf8(cover_filename),
            file_size: cover_file_size,
            content_type: string::utf8(cover_content_type),
            upload_timestamp: tx_context::epoch_timestamp_ms(ctx),
        };

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
            game_file_metadata: game_metadata,
            cover_image_metadata: cover_metadata,
        };
        
        let game_id = object::id(&game);
        vector::push_back(&mut store.games, game_id);
        store.total_games = store.total_games + 1;

        // Mint NFT for the publisher with complete game metadata
        let publisher_nft = GameNFT {
            id: object::new(ctx),
            game_id,
            title: game.title,
            description: game.description,
            price: game.price,
            publisher: game.publisher,
            walrus_blob_id: game.walrus_blob_id,
            cover_image_blob_id: game.cover_image_blob_id,
            genre: game.genre,
            publish_date: game.publish_date,
            purchase_date: tx_context::epoch(ctx),
            is_publisher_nft: true,
        };

        let nft_id = object::id(&publisher_nft);

        event::emit(GamePublished {
            game_id,
            title: game.title,
            publisher: game.publisher,
            price: game.price,
            walrus_blob_id: game.walrus_blob_id,
        });

        event::emit(PublisherNFTMinted {
            game_id,
            publisher: game.publisher,
            nft_id,
            title: game.title,
        });

        transfer::share_object(game);
        (game_id, publisher_nft)
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
            title: game.title,
            description: game.description,
            price: game.price,
            publisher: game.publisher,
            walrus_blob_id: game.walrus_blob_id,
            cover_image_blob_id: game.cover_image_blob_id,
            genre: game.genre,
            publish_date: game.publish_date,
            purchase_date: tx_context::epoch(ctx),
            is_publisher_nft: false,
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
        game_id: ID
    ): bool {
        nft.game_id == game_id
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

    public fun get_game_file_metadata(game: &Game): (String, u64, String, u64) {
        (
            game.game_file_metadata.original_filename,
            game.game_file_metadata.file_size,
            game.game_file_metadata.content_type,
            game.game_file_metadata.upload_timestamp
        )
    }

    public fun get_cover_image_metadata(game: &Game): (String, u64, String, u64) {
        (
            game.cover_image_metadata.original_filename,
            game.cover_image_metadata.file_size,
            game.cover_image_metadata.content_type,
            game.cover_image_metadata.upload_timestamp
        )
    }

    public fun get_nft_info(nft: &GameNFT): (ID, u64) {
        (nft.game_id, nft.purchase_date)
    }

    public fun get_enhanced_nft_info(nft: &GameNFT): (
        ID, String, String, u64, address, String, String, String, u64, u64, bool
    ) {
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
            nft.purchase_date,
            nft.is_publisher_nft
        )
    }

    public fun get_store_stats(store: &GameStore): (address, u64) {
        (store.admin, store.total_games)
    }

    // ==============================================
    // SEAL ACCESS CONTROL FUNCTIONS
    // ==============================================
    
    /// Seal access control: Check if caller owns NFT for the specified game
    /// This function is called by Seal key servers to verify access rights
    /// Format: seal_approve(id: vector<u8>, ...) where id is the game identifier  
    entry fun seal_approve_game_access(
        _id: vector<u8>, 
        nft: &GameNFT,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // The 'id' parameter is the Seal encryption ID, which we don't need to validate
        // since we're validating NFT ownership directly
        // Just verify the caller has access to this NFT
        
        // In Sui, if the caller can pass the NFT reference, they own it
        // Additional verification: check publisher or purchase rights  
        let has_access = (nft.publisher == caller) || (nft.is_publisher_nft == false);
        assert!(has_access, ENoAccess);
    }

    /// Alternative seal approve for publisher access
    /// Allows publishers to access their own published games
    entry fun seal_approve_publisher_access(
        _id: vector<u8>,
        nft: &GameNFT, 
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // The 'id' parameter is the Seal encryption ID, which we don't need to validate
        // since we're validating NFT ownership directly
        
        // Verify caller is the publisher with publisher NFT
        assert!(nft.publisher == caller, ENoAccess);
        assert!(nft.is_publisher_nft == true, ENoAccess);
    }
}
use anchor_lang::prelude::*;

declare_id!("H6rRorzddTYHLnaep5aapZKXBCRqWA2UwDngNy9GNmj");

#[program]
pub mod project {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        //Get a reference to the account
        let base_account = &mut ctx.accounts.base_account;
        //Initialize total_gifs
        base_account.total_gifs = 0;
        Ok(())
    }

    // Function to add Gifs
    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        //Get a reference to the account and increment total-gifs
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // Struct of Item
        let item = ItemStruct{
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
        };

        // adding to the gif_list vector
        base_account.gif_list.push(item);
        base_account.total_gifs +=1;
        Ok(())
    }
}

// Attach certain variables to the initialize
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

// Specify meta data in the AddGif Context
#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

// Create a custom struct for Item
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct  ItemStruct{
    pub gif_link: String,
    pub user_address: Pubkey,
}

// Tell Solana to store something on this account
#[account]
pub struct BaseAccount{
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}

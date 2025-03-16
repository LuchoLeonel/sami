use crate::*;

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault_balance = ctx.accounts.vault.to_account_info().lamports();

    // Verify that the vault has enough funds
    require!(vault_balance >= amount, SimpleSAMIError::InsufficientFunds);

    // Transfer SOL from the vault to the owner
    **ctx
        .accounts
        .vault
        .to_account_info()
        .try_borrow_mut_lamports()? -= amount;
    **ctx
        .accounts
        .owner
        .to_account_info()
        .try_borrow_mut_lamports()? += amount;

    msg!("WithdrawFromReserves: amount = {}", amount);
    Ok(())
}

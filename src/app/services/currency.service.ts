import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Currency } from './shopping-list-data.service';
import { SupabaseConnector } from './supabase-connector';

const CURRENCY_STORAGE_KEY = 'nimmit-currency';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly supabaseService = inject(SupabaseConnector);

  readonly availableCurrencies: Currency[] = ['Euro', 'CHF', 'USD'];
  readonly currentCurrency = signal<Currency>(this.getInitialCurrency());

  // Fixed conversion rates compared to USD
  private readonly rates: Record<Currency, number> = {
    USD: 1.0,
    Euro: 0.92,
    CHF: 0.90
  };

  private readonly symbols: Record<Currency, string> = {
    USD: '$',
    Euro: '€',
    CHF: 'CHF'
  };

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        this.saveCurrency(this.currentCurrency());
      });
    }

    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session) {
          const profile = await this.supabaseService.getProfile(session.user.id);
          if (profile?.settings?.currency && this.availableCurrencies.includes(profile.settings.currency as Currency)) {
            this.currentCurrency.set(profile.settings.currency as Currency);
          }
        }
      }
    });
  }

  async setCurrency(currency: Currency): Promise<void> {
    if (this.availableCurrencies.includes(currency)) {
      this.currentCurrency.set(currency);

      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        await this.supabaseService.updateProfileCurrency(user.id, currency);
      }
    }
  }

  getSymbol(currency: Currency = this.currentCurrency()): string {
    return this.symbols[currency];
  }

  convertFromUsd(usdAmount: number, targetCurrency: Currency = this.currentCurrency()): number {
    return usdAmount * this.rates[targetCurrency];
  }

  convertToUsd(amount: number, sourceCurrency: Currency): number {
    return amount / this.rates[sourceCurrency];
  }

  format(usdAmount: number): string {
    const converted = this.convertFromUsd(usdAmount);
    const symbol = this.getSymbol();
    // Round to 2 decimal places
    const rounded = Math.round(converted * 100) / 100;
    if (this.currentCurrency() === 'Euro') {
      return `${rounded.toFixed(2).replace('.', ',')} ${symbol}`;
    }
    if (this.currentCurrency() === 'CHF') {
      return `${rounded.toFixed(2)} ${symbol}`;
    }
    return `${symbol}${rounded.toFixed(2)}`;
  }

  private getInitialCurrency(): Currency {
    if (!this.isBrowser) {
      return 'Euro'; // Default
    }

    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && this.availableCurrencies.includes(stored as Currency)) {
      return stored as Currency;
    }

    return 'Euro';
  }

  private saveCurrency(currency: Currency): void {
    if (this.isBrowser) {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    }
  }
}

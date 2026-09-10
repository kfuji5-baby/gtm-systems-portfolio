// Portfolio-safe representative implementation.
// Reproduces verified production behavior without company-specific API names.

import { LightningElement } from 'lwc';
import searchCustomers from '@salesforce/apex/CustomerMasterCockpitController.searchCustomers';

export default class CustomerMasterCockpit extends LightningElement {
    query = '';
    filters = {
        ownerId: null,
        status: null,
        desiredAreas: [],
        inquiryAreas: [],
        railLines: [],
        stations: [],
        budgetMin: null,
        budgetMax: null,
        inactiveDaysMin: null,
        combination: 'AND',
        excludeUnsafe: true
    };

    results = [];
    isLoading = false;
    error;

    handleQueryChange(event) {
        this.query = event.target.value;
    }

    handleFilterChange(event) {
        const { name, value } = event.detail;
        this.filters = { ...this.filters, [name]: value };
    }

    async handleSearch() {
        this.isLoading = true;
        this.error = undefined;

        try {
            this.results = await searchCustomers({
                requestJson: JSON.stringify({
                    query: normalizeSearchText(this.query),
                    ...this.filters
                })
            });
        } catch (e) {
            this.error = e?.body?.message || e?.message || 'Search failed';
            this.results = [];
        } finally {
            this.isLoading = false;
        }
    }

    handleReset() {
        this.query = '';
        this.filters = {
            ownerId: null,
            status: null,
            desiredAreas: [],
            inquiryAreas: [],
            railLines: [],
            stations: [],
            budgetMin: null,
            budgetMax: null,
            inactiveDaysMin: null,
            combination: 'AND',
            excludeUnsafe: true
        };
        this.results = [];
    }
}

function normalizeSearchText(value) {
    if (!value) return '';

    return value
        .trim()
        .normalize('NFKC')
        .replace(/[‐‑‒–—―ー]/g, '-')
        .replace(/\s+/g, ' ');
}

import {ValidationError} from "../model/membership.types";

export interface ValidationResult {
    isValid: boolean;
    error?: ValidationError;
}


// Validation function for membership creation request - handles 8 error cases
export function validateCreateMembershipRequest(data: any): ValidationResult {
    // Check if required fields are present
    if (!data.name || !data.recurringPrice) {
        return {
            isValid: false,
            error: 'missingMandatoryFields'
        };
    }

    // Check for negative price
    if (data.recurringPrice < 0) {
        return {
            isValid: false,
            error: 'negativeRecurringPrice'
        };
    }

    // Cash payment method has price limitations
    if (data.recurringPrice > 100 && data.paymentMethod === 'cash') {
        return {
            isValid: false,
            error: 'cashPriceBelow100'
        };
    }

    return validateBillingPeriods(data.billingInterval, data.billingPeriods);
}

function validateBillingPeriods(billingInterval: string, billingPeriods: number): ValidationResult {
    // TODO: find easy way to validate any billing interval eg. quarterly, daily
    switch (billingInterval) {
        case 'monthly':
            if (billingPeriods > 12) {
                return {isValid: false, error: 'billingPeriodsMoreThan12Months'};
            }
            if (billingPeriods < 6) {
                return {isValid: false, error: 'billingPeriodsLessThan6Months'};
            }
            return {isValid: true};

        case 'yearly':
            if (billingPeriods > 10) {
                return {isValid: false, error: 'billingPeriodsMoreThan10Years'};
            }
            if (billingPeriods < 3) {
                return {isValid: false, error: 'billingPeriodsLessThan3Years'};
            }
            return {isValid: true};

        default:
            return {isValid: false, error: 'invalidBillingPeriods'};
    }
}


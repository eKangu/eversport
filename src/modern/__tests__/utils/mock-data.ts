/**
 * @fileoverview Mock data for tests - not a test file
 */
import {Membership, MembershipCreateRequest, MembershipPeriod} from '../../model/membership.types';

export const mockMemberships: Membership[] = [
    {
        id: 1,
        uuid: 'test-uuid-1',
        name: 'Test Membership',
        userId: 2000,
        recurringPrice: 100,
        validFrom: '2023-01-01T00:00:00.000Z',
        validUntil: '2023-12-31T00:00:00.000Z',
        state: 'active',
        assignedBy: 'Admin',
        paymentMethod: 'credit card',
        billingInterval: 'monthly',
        billingPeriods: 12
    },
    {
        id: 2,
        uuid: 'test-uuid-2',
        name: 'Gold Plan',
        userId: 2000,
        recurringPrice: 200,
        validFrom: '2023-02-01T00:00:00.000Z',
        validUntil: '2024-02-01T00:00:00.000Z',
        state: 'active',
        assignedBy: 'Admin',
        paymentMethod: 'cash',
        billingInterval: 'yearly',
        billingPeriods: 1
    }
];

export const mockPeriods: MembershipPeriod[] = [
    {
        id: 1,
        uuid: 'test-period-uuid-1',
        membership: 1,
        start: '2023-01-01T00:00:00.000Z',
        end: '2023-02-01T00:00:00.000Z',
        state: 'active'
    },
    {
        id: 2,
        uuid: 'test-period-uuid-2',
        membership: 1,
        start: '2023-02-01T00:00:00.000Z',
        end: '2023-03-01T00:00:00.000Z',
        state: 'active'
    },
    {
        id: 3,
        uuid: 'test-period-uuid-3',
        membership: 2,
        start: '2023-02-01T00:00:00.000Z',
        end: '2024-02-01T00:00:00.000Z',
        state: 'active'
    }
];

export const validMembershipRequest: MembershipCreateRequest = {
    name: 'New Membership',
    recurringPrice: 75,
    paymentMethod: 'credit card',
    billingInterval: 'monthly',
    billingPeriods: 8
};

export const invalidMembershipRequests = {
    missingName: {
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'monthly' as const,
        billingPeriods: 8
    },
    negativePrice: {
        name: 'Invalid Price Plan',
        recurringPrice: -10,
        paymentMethod: 'credit card' as const,
        billingInterval: 'monthly' as const,
        billingPeriods: 8
    },
    invalidCashPrice: {
        name: 'Invalid Cash Plan',
        recurringPrice: 150,
        paymentMethod: 'cash' as const,
        billingInterval: 'monthly' as const,
        billingPeriods: 8
    },
    tooManyMonths: {
        name: 'Too Many Months Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'monthly' as const,
        billingPeriods: 13
    },
    tooFewMonths: {
        name: 'Too Few Months Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'monthly' as const,
        billingPeriods: 5
    },
    tooManyYears: {
        name: 'Too Many Years Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'yearly' as const,
        billingPeriods: 11
    },
    invalidYears: {
        name: 'Invalid Years Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'yearly' as const,
        billingPeriods: 5
    },
    invalidBillingInterval: {
        name: 'Invalid Interval Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'quarterly' as any,
        billingPeriods: 4
    },
    billingPeriodsLessThan3Years: {
        name: 'Invalid Periods Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'yearly' as const,
        billingPeriods: 2
    },
    billingPeriodsMoreThan10Years: {
        name: 'Invalid Periods Plan',
        recurringPrice: 75,
        paymentMethod: 'credit card' as const,
        billingInterval: 'yearly' as const,
        billingPeriods: 15
    }
};

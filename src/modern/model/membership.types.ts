// Entity: Membership (not the same like in readme.md)
export interface Membership {
    id: number; // based on memberships.json is
    uuid: string; // based on memberships.json is
    name: string; // name of the membership
    userId: number; // userId is in memberships.json and in legacy get response is userId // the user that the membership is assigned to
    recurringPrice: number; // price the user has to pay for every period
    validFrom: string; // string is more safely than Date // start of the validity
    validUntil: string; // string is more safely than Date // end of the validity
    state: string; // indicates the state of the membership
    assignedBy: string;
    paymentMethod: string | null; // null is in memberships.json // which payment method will be used to pay for the periods
    billingInterval: string; // the interval unit of the periods
    billingPeriods: number; // the number of periods the membership has
}


// Entity: MembershipPeriod
export interface MembershipPeriod {
    id: number;
    uuid: string;
    membership: number; // membership the period is attached to
    start: string; // string is more savely than Date // indicates the start of the period
    end: string; // string is more savely than Date // indicates the end of the period
    state: string;
}

// get response
export interface MembershipResponse {
    membership: Membership;
    periods: MembershipPeriod[];
}

// post create request
export interface MembershipCreateRequest {
    name: string;
    recurringPrice: number;
    paymentMethod: 'credit card' | 'cash' | null; // base on memberships.json
    billingInterval: string; // monthly | yerly | quartaly ?
    billingPeriods: number;
}

// becouse legacy response is not same as entity
type PostMembership = Omit<Membership, 'userId'> & {
    user: number;
};
type PostMembershipPeriod = Omit<MembershipPeriod, 'membership'> & {
    membershipId: number;
};

// post response
export interface MembershipCreateResponse {
    membership: PostMembership;
    membershipPeriods: PostMembershipPeriod[]; // in get field name is periods
}

export type ValidationError =
    | 'missingMandatoryFields'
    | 'negativeRecurringPrice'
    | 'cashPriceBelow100'
    | 'billingPeriodsLessThan6Months'
    | 'billingPeriodsMoreThan12Months'
    | 'billingPeriodsLessThan3Years'
    | 'billingPeriodsMoreThan10Years'
    | 'invalidBillingPeriods';


export class MembershipValidationError extends Error {
    constructor(
        public readonly validationError: ValidationError,
        public readonly statusCode: number = 400 // all errors in legacy api are 400
    ) {
        super(validationError);
        this.name = 'MembershipValidationError'; // for better debuging
    }
}

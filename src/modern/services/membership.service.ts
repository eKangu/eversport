import {
    Membership,
    MembershipCreateRequest,
    MembershipCreateResponse,
    MembershipPeriod,
    MembershipResponse,
    MembershipValidationError
} from '../model/membership.types'
import fs from "fs/promises";
import path from "path";
import {v4 as uuidv4} from 'uuid';
import {validateCreateMembershipRequest} from "../utils/validation.utils";

export class MembershipService {

    private readonly membershipsPath = path.join(__dirname, '../../data/memberships.json');
    private readonly periodsPath = path.join(__dirname, '../../data/membership-periods.json');


    // get
    async getAllMembershipsWithPeriods(): Promise<MembershipResponse[]> {
        const [memberships, periods] = await Promise.all([
            this.loadMemberships(),
            this.loadPeriods()
        ]);


        return memberships.map(membership => ({
            membership,
            // FIX Bug:  p.membership === membership.id (not p.membershipId)
            periods: periods.filter(p => p.membership === membership.id)
        }));
    }

    private async loadMemberships(): Promise<Membership[]> {
        const data = await fs.readFile(this.membershipsPath, 'utf-8');
        return JSON.parse(data);
    }

    private async loadPeriods(): Promise<MembershipPeriod[]> {
        const data = await fs.readFile(this.periodsPath, 'utf-8');
        return JSON.parse(data);
    }

    // post - create
    async createMembership(request: MembershipCreateRequest): Promise<MembershipCreateResponse> {
        // validation like in legacy
        const validationResult = validateCreateMembershipRequest(request);
        if (!validationResult.isValid) {
            throw new MembershipValidationError(validationResult.error!);
        }

        const [memberships, periods] = await Promise.all([
            this.loadMemberships(),
            this.loadPeriods()
        ]);

        // new membership
        const newMembershipId = this.getNextId(memberships);
        const validFrom = new Date();
        const validUntil = this.calculateValidUntil(validFrom, request.billingInterval, request.billingPeriods);

        const newMembership: Membership = {
            id: newMembershipId,
            uuid: uuidv4(),
            name: request.name,
            userId: 2000, // in legacy hardcoded value
            recurringPrice: request.recurringPrice,
            validFrom: validFrom.toISOString(),
            validUntil: validUntil.toISOString(),
            state: 'active',
            assignedBy: 'Admin', // in legacy not set
            paymentMethod: request.paymentMethod,
            billingInterval: request.billingInterval,
            billingPeriods: request.billingPeriods
        };

        // generate periods
        const newPeriods: MembershipPeriod[] = this.generateMembershipPeriods(
            newMembershipId,
            validFrom,
            request.billingInterval,
            request.billingPeriods,
            this.getNextId(periods)
        );

        // FIX legacy bug: persist to JSON files (no variable shadowing)
        const updatedMemberships = [...memberships, newMembership];
        const updatedPeriods = [...periods, ...newPeriods];

        // update data file (not only in memory)
        await Promise.all([
            this.saveMemberships(updatedMemberships),
            this.savePeriods(updatedPeriods)
        ]);

        // legacy-compatible response format
        return this.formatCreateResponse(newMembership, newPeriods);
    }


    private getNextId(items: { id: number }[]): number {
        return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1; // or items.length + 1
    }

    private calculateValidUntil(validFrom: Date, billingInterval: string, billingPeriods: number): Date {

        const validUntil = new Date(validFrom);

        switch (billingInterval) {
            case 'monthly':
                validUntil.setMonth(validUntil.getMonth() + billingPeriods);
                validUntil.setDate(1);
                break;
            // case 'quarterly':
            //     validUntil.setMonth(validUntil.getMonth() + billingPeriods * 3);
            //     break;
            case 'yearly':
                validUntil.setFullYear(validUntil.getFullYear() + billingPeriods);
                break;
        }
        return validUntil;
    }

    private generateMembershipPeriods(newMembershipId: number, validFrom: Date, billingInterval: string, billingPeriods: number, nextId: number): MembershipPeriod[] {
        const membershipPeriods: MembershipPeriod[] = [];
        let periodStart = new Date(validFrom);

        for (let i = 0; i < billingPeriods; i++) {
            const periodEnd = new Date(periodStart);
            switch (billingInterval) {
                case 'monthly':
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    break;
                // case 'quarterly':
                //     periodEnd.setMonth(periodEnd.getMonth() + 3);
                //     break;
                case 'yearly':
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                    break;
            }

            membershipPeriods.push({
                id: nextId + i,
                uuid: uuidv4(),
                membership: newMembershipId,
                start: periodStart.toISOString(),
                end: periodEnd.toISOString(),
                state: 'active'
            });

            periodStart = periodEnd;
        }

        return membershipPeriods;
    }

    // save/update to file (file as database)
    private async savePeriods(updatedPeriods: MembershipPeriod[]): Promise<void> {
        await fs.writeFile(this.periodsPath, JSON.stringify(updatedPeriods, null, 2));
    }

    private async saveMemberships(updatedMemberships: Membership[]): Promise<void> {
        await fs.writeFile(this.membershipsPath, JSON.stringify(updatedMemberships, null, 2));
    }

    private formatCreateResponse(newMembership: Membership, newPeriods: MembershipPeriod[]): MembershipCreateResponse {
        const {userId, ...membershipWithoutUserId} = newMembership;
        // legacy response structure
        return {
            membership: {
                ...membershipWithoutUserId,
                user: newMembership.userId
            },
            membershipPeriods: newPeriods.map(period => {
                const {membership, ...periodWithoutMembership} = period;
                return {
                    ...periodWithoutMembership,
                    membershipId: period.membership
                };
            })
        }
    }
}

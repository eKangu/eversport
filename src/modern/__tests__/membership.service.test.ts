import {MembershipService} from '../services/membership.service';
import {MembershipValidationError} from '../model/membership.types';
import {invalidMembershipRequests, mockMemberships, mockPeriods, validMembershipRequest} from './utils/mock-data';
import fs from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MembershipService', () => {
    let service: MembershipService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new MembershipService();

        // Mock file reads
        mockFs.readFile.mockImplementation(async (filePath: any) => {
            if (filePath.includes('memberships.json')) {
                return JSON.stringify(mockMemberships);
            }
            if (filePath.includes('membership-periods.json')) {
                return JSON.stringify(mockPeriods);
            }
            throw new Error('File not found');
        });

        // Mock file writes
        mockFs.writeFile.mockResolvedValue(undefined);
    });

    describe('getAllMembershipsWithPeriods', () => {
        it('should return all memberships with their periods', async () => {
            const result = await service.getAllMembershipsWithPeriods();

            expect(result).toHaveLength(2);
            expect(result[0].membership.id).toBe(1);
            expect(result[0].periods).toHaveLength(2); // 2 periods for membership 1
            expect(result[1].membership.id).toBe(2);
            expect(result[1].periods).toHaveLength(1); // 1 period for membership 2
        });

        it('should filter periods correctly by membership ID', async () => {
            const result = await service.getAllMembershipsWithPeriods();

            // Check that periods are correctly filtered
            expect(result[0].periods.every(p => p.membership === 1)).toBe(true);
            expect(result[1].periods.every(p => p.membership === 2)).toBe(true);
        });
    });

    describe('createMembership', () => {
        it('should create a new membership successfully', async () => {
            const result = await service.createMembership(validMembershipRequest);

            expect(result.membership.name).toBe(validMembershipRequest.name);
            expect(result.membership.recurringPrice).toBe(validMembershipRequest.recurringPrice);
            expect(result.membership.billingInterval).toBe(validMembershipRequest.billingInterval);
            expect(result.membership.billingPeriods).toBe(validMembershipRequest.billingPeriods);
            expect(result.membership.user).toBe(2000); // hardcoded userId
            expect(result.membershipPeriods).toHaveLength(validMembershipRequest.billingPeriods);

            // Verify file writes were called
            expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // memberships and periods files
        });

        it('should generate correct number of periods', async () => {
            const result = await service.createMembership(validMembershipRequest);

            expect(result.membershipPeriods).toHaveLength(8); // billingPeriods = 8
            expect(result.membershipPeriods[0].membershipId).toBe(result.membership.id);
        });

        it('should throw validation error for missing mandatory fields', async () => {
            await expect(service.createMembership(invalidMembershipRequests.missingName as any))
                .rejects.toThrow(MembershipValidationError);

            try {
                await service.createMembership(invalidMembershipRequests.missingName as any);
            } catch (error) {
                if (error instanceof MembershipValidationError) {
                    expect(error.validationError).toBe('missingMandatoryFields');
                }
            }
        });

        it('should throw validation error for negative price', async () => {
            await expect(service.createMembership(invalidMembershipRequests.negativePrice))
                .rejects.toThrow(MembershipValidationError);

            try {
                await service.createMembership(invalidMembershipRequests.negativePrice);
            } catch (error) {
                if (error instanceof MembershipValidationError) {
                    expect(error.validationError).toBe('negativeRecurringPrice');
                }
            }
        });

        it('should throw validation error for invalid cash price', async () => {
            await expect(service.createMembership(invalidMembershipRequests.invalidCashPrice))
                .rejects.toThrow(MembershipValidationError);
        });

        it('should throw validation error for too many monthly periods', async () => {
            await expect(service.createMembership(invalidMembershipRequests.tooManyMonths))
                .rejects.toThrow(MembershipValidationError);
        });

        it('should throw validation error for too few monthly periods', async () => {
            await expect(service.createMembership(invalidMembershipRequests.tooFewMonths))
                .rejects.toThrow(MembershipValidationError);
        });

        it('should throw validation error for too many yearly periods', async () => {
            await expect(service.createMembership(invalidMembershipRequests.tooManyYears))
                .rejects.toThrow(MembershipValidationError);
        });

        it('should throw validation error for invalid billing interval', async () => {
            await expect(service.createMembership(invalidMembershipRequests.invalidBillingInterval))
                .rejects.toThrow(MembershipValidationError);
        });

        it('should throw validation error for periods less than 3 years', async () => {
            await expect(service.createMembership(invalidMembershipRequests.billingPeriodsLessThan3Years))
                .rejects.toThrow(MembershipValidationError);
        });

    });
});


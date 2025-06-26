import express, {Express} from 'express';
import request from 'supertest';
import membershipRoutes from '../routes/membership.routes';
import {MembershipService} from '../services/membership.service';
import {MembershipValidationError} from '../model/membership.types';
import {mockMemberships, mockPeriods, validMembershipRequest} from './utils/mock-data';

// Mock the entire MembershipService module
jest.mock('../services/membership.service');

describe('Membership Routes', () => {
    let app: Express;
    let mockService: jest.Mocked<MembershipService>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create app instance
        app = express();
        app.use(express.json());

        // Mock the MembershipService constructor
        const MockedMembershipService = MembershipService as jest.MockedClass<typeof MembershipService>;
        mockService = {
            getAllMembershipsWithPeriods: jest.fn(),
            createMembership: jest.fn(),
            loadMemberships: jest.fn(),
            loadPeriods: jest.fn(),
            saveMemberships: jest.fn(),
            savePeriods: jest.fn(),
            getNextId: jest.fn(),
            calculateValidUntil: jest.fn(),
            generateMembershipPeriods: jest.fn(),
            formatCreateResponse: jest.fn()
        } as any;

        MockedMembershipService.mockImplementation(() => mockService);

        // Setup default mocks
        mockService.getAllMembershipsWithPeriods.mockResolvedValue(
            mockMemberships.map(membership => ({
                membership,
                periods: mockPeriods.filter(p => p.membership === membership.id)
            }))
        );

        mockService.createMembership.mockImplementation(async (request: any) => {
            return {
                membership: {
                    ...mockMemberships[0],
                    name: request.name,
                    recurringPrice: request.recurringPrice,
                    billingInterval: request.billingInterval,
                    billingPeriods: request.billingPeriods,
                    user: 2000,
                    uuid: 'new-membership-uuid'
                },
                membershipPeriods: Array(request.billingPeriods).fill(0).map((_, i) => ({
                    ...mockPeriods[0],
                    id: 100 + i,
                    uuid: `new-period-uuid-${i}`,
                    membershipId: mockMemberships[0].id
                }))
            };
        });

        // Use the route after setting up mocks
        app.use('/memberships', membershipRoutes);
    });

    describe('GET /memberships', () => {
        it('should return all memberships with their periods', async () => {
            const response = await request(app).get('/memberships');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(mockMemberships.length);
            expect(mockService.getAllMembershipsWithPeriods).toHaveBeenCalledTimes(1);
        });

        it('should handle errors and return 500', async () => {
            mockService.getAllMembershipsWithPeriods.mockRejectedValueOnce(
                new Error('Database error')
            );

            const response = await request(app).get('/memberships');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({message: 'Internal server error'});
        });
    });

    describe('POST /memberships', () => {
        it('should create a new membership and return 201', async () => {
            const response = await request(app)
                .post('/memberships')
                .send(validMembershipRequest);

            expect(response.status).toBe(201);
            expect(response.body.membership.name).toBe(validMembershipRequest.name);
            expect(response.body.membership.recurringPrice).toBe(validMembershipRequest.recurringPrice);
            expect(response.body.membershipPeriods).toHaveLength(validMembershipRequest.billingPeriods);
            expect(mockService.createMembership).toHaveBeenCalledWith(validMembershipRequest);
        });

        it('should return 400 with error message when validation fails', async () => {
            mockService.createMembership.mockRejectedValueOnce(
                new MembershipValidationError('missingMandatoryFields')
            );

            const response = await request(app)
                .post('/memberships')
                .send({ /* empty request */});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({message: 'missingMandatoryFields'});
        });

        it('should return 500 for unexpected errors', async () => {
            mockService.createMembership.mockRejectedValueOnce(
                new Error('Unexpected error')
            );

            const response = await request(app)
                .post('/memberships')
                .send(validMembershipRequest);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({message: 'Internal server error'});
        });
    });
});


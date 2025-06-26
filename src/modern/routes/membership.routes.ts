import express, {Request, Response} from "express"
import {MembershipService} from "../services/membership.service";
import {MembershipValidationError} from "../model/membership.types";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const membershipService = new MembershipService();
        const membershipsWithPeriods = await membershipService.getAllMembershipsWithPeriods();
        res.status(200).json(membershipsWithPeriods);
    } catch (error) {
        console.error('Error in GET /memberships:', error);
        res.status(500).json({message: 'Internal server error'});
    }
})

router.post("/", async (req: Request, res: Response) => {
    try {
        const membershipService = new MembershipService();
        const result = await membershipService.createMembership(req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof MembershipValidationError) {
            // Return 400 with legacy error message
            res.status(400).json({message: error.validationError});
        } else {
            console.error('Error in POST /memberships:', error);
            res.status(500).json({message: 'Internal server error'});
        }
    }
})

export default router;

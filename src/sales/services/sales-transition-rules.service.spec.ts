import { Test, TestingModule } from '@nestjs/testing';
import { SalesTransitionRulesService } from './sales-transition-rules.service';
import { SaleStatus } from '../entities/sale.entity';

describe('SalesTransitionRulesService', () => {
    let service: SalesTransitionRulesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SalesTransitionRulesService],
        }).compile();

        service = module.get<SalesTransitionRulesService>(SalesTransitionRulesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getValidTransitions', () => {
        it('should return RESERVED for buyer when sale is AVAILABLE', () => {
            const transitions = service.getValidTransitions(SaleStatus.AVAILABLE, 'buyer');
            expect(transitions).toContain(SaleStatus.RESERVED);
        });

        it('should return SHIPPED for seller when sale is RESERVED', () => {
            const transitions = service.getValidTransitions(SaleStatus.RESERVED, 'seller');
            expect(transitions).toContain(SaleStatus.SHIPPED);
        });

        it('should return DELIVERED for buyer when sale is SHIPPED', () => {
            const transitions = service.getValidTransitions(SaleStatus.SHIPPED, 'buyer');
            expect(transitions).toContain(SaleStatus.DELIVERED);
        });

        it('should return CANCELLED for both seller and buyer when sale is RESERVED', () => {
            const sellerTransitions = service.getValidTransitions(SaleStatus.RESERVED, 'seller');
            const buyerTransitions = service.getValidTransitions(SaleStatus.RESERVED, 'buyer');

            expect(sellerTransitions).toContain(SaleStatus.CANCELLED);
            expect(buyerTransitions).toContain(SaleStatus.CANCELLED);
        });

        it('should return empty array for invalid role/status combinations', () => {
            const transitions = service.getValidTransitions(SaleStatus.COMPLETED, 'buyer');
            expect(transitions).toEqual([]);
        });
    });

    describe('validateTransition', () => {
        it('should validate AVAILABLE to RESERVED transition for buyer', () => {
            const sale = { quantity: 5 };
            const providedFields = { quantity: 3 };

            const result = service.validateTransition(
                SaleStatus.AVAILABLE,
                SaleStatus.RESERVED,
                'buyer',
                sale,
                providedFields
            );

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject transition if role is not allowed', () => {
            const sale = { quantity: 5 };
            const providedFields = { quantity: 3 };

            const result = service.validateTransition(
                SaleStatus.AVAILABLE,
                SaleStatus.RESERVED,
                'seller', // seller cannot reserve
                sale,
                providedFields
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('User with role seller is not allowed to perform this transition');
        });

        it('should reject transition if required fields are missing', () => {
            const sale = {};
            const providedFields = {}; // missing shippingProof

            const result = service.validateTransition(
                SaleStatus.RESERVED,
                SaleStatus.SHIPPED,
                'seller',
                sale,
                providedFields
            );

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('Missing required fields'))).toBe(true);
        });

        it('should reject invalid transition paths', () => {
            const sale = {};
            const providedFields = {};

            const result = service.validateTransition(
                SaleStatus.AVAILABLE,
                SaleStatus.COMPLETED, // cannot go directly from AVAILABLE to COMPLETED
                'seller',
                sale,
                providedFields
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid transition from available to completed');
        });

        it('should validate custom validation function', () => {
            const saleWithZeroQuantity = { quantity: 0 };
            const providedFields = { quantity: 0 };

            const result = service.validateTransition(
                SaleStatus.AVAILABLE,
                SaleStatus.RESERVED,
                'buyer',
                saleWithZeroQuantity,
                providedFields
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Custom validation failed');
        });
    });

    describe('getTransitionRule', () => {
        it('should return rule for valid transition', () => {
            const rule = service.getTransitionRule(SaleStatus.AVAILABLE, SaleStatus.RESERVED);

            expect(rule).toBeDefined();
            expect(rule?.allowedRoles).toContain('buyer');
            expect(rule?.requiredFields).toContain('quantity');
        });

        it('should return undefined for invalid transition', () => {
            const rule = service.getTransitionRule(SaleStatus.COMPLETED, SaleStatus.AVAILABLE);
            expect(rule).toBeUndefined();
        });
    });
});

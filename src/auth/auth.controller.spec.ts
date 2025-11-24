import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: any;

    beforeEach(async () => {
        authService = {
            login: jest.fn(),
            register: jest.fn(),
            googleLogin: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should call authService.login', async () => {
            const dto = { email: 'test@test.com', password: 'pass' };
            const result = { access_token: 'token', user: {} as any };
            authService.login.mockResolvedValue(result);

            expect(await controller.login(dto)).toBe(result);
            expect(authService.login).toHaveBeenCalledWith(dto);
        });
    });

    describe('register', () => {
        it('should call authService.register', async () => {
            const dto = { email: 'test@test.com', password: 'pass', name: 'Test' };
            const result = { access_token: 'token', user: {} as any };
            authService.register.mockResolvedValue(result);

            expect(await controller.register(dto)).toBe(result);
            expect(authService.register).toHaveBeenCalledWith(dto);
        });
    });

    describe('googleAuth', () => {
        it('should be defined', async () => {
            expect(await controller.googleAuth()).toBeUndefined();
        });
    });

    describe('googleAuthRedirect', () => {
        it('should redirect with token', async () => {
            const req = { user: { email: 'google@test.com' } };
            const res = { redirect: jest.fn() } as unknown as Response;
            const result = { access_token: 'token' };

            authService.googleLogin.mockResolvedValue(result);

            await controller.googleAuthRedirect(req, res);

            expect(authService.googleLogin).toHaveBeenCalledWith(req.user);
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:4200/auth/callback?token=token');
        });
    });
});

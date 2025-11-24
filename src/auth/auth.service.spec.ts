import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: any;
    let jwtService: any;

    beforeEach(async () => {
        usersService = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            getCurrentTier: jest.fn(),
        };

        jwtService = {
            sign: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: usersService },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user if validation succeeds', async () => {
            const user = { id: '1', email: 'test@test.com', password: 'hashedPassword' };
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@test.com', 'password');
            expect(result).toEqual(user);
        });

        it('should return null if user not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            const result = await service.validateUser('test@test.com', 'password');
            expect(result).toBeNull();
        });

        it('should return null if password mismatch', async () => {
            const user = { id: '1', email: 'test@test.com', password: 'hashedPassword' };
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser('test@test.com', 'wrongPassword');
            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user info on success', async () => {
            const user = {
                id: '1',
                email: 'test@test.com',
                password: 'hashedPassword',
                name: 'Test User',
                role: 'user',
                avatar_url: 'avatar.jpg'
            };
            const tier = { name: 'Free' };

            usersService.findByEmail.mockResolvedValue(user);
            usersService.getCurrentTier.mockResolvedValue(tier);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.sign.mockReturnValue('token');

            const result = await service.login({ email: 'test@test.com', password: 'password' });

            expect(result).toEqual({
                access_token: 'token',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    tier,
                },
            });
        });

        it('should throw UnauthorizedException if user not found', async () => {
            usersService.findByEmail.mockRejectedValue(new Error('User not found'));

            await expect(service.login({ email: 'test@test.com', password: 'password' }))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password invalid', async () => {
            const user = { id: '1', email: 'test@test.com', password: 'hashedPassword' };
            usersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should register new user and return token', async () => {
            const registerDto = {
                email: 'new@test.com',
                password: 'password',
                name: 'New User'
            };
            const user = {
                id: '1',
                ...registerDto,
                role: 'user',
                avatar_url: null
            };
            const tier = { name: 'Free' };

            usersService.findByEmail.mockRejectedValue(new Error('Not found')); // Simulate user not found
            usersService.create.mockResolvedValue(user);
            usersService.getCurrentTier.mockResolvedValue(tier);
            jwtService.sign.mockReturnValue('token');

            const result = await service.register(registerDto);

            expect(usersService.create).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual({
                access_token: 'token',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    tier,
                },
            });
        });

        it('should throw ConflictException if user already exists', async () => {
            const registerDto = { email: 'existing@test.com', password: 'password', name: 'User' };
            usersService.findByEmail.mockResolvedValue({ id: '1' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('googleLogin', () => {
        it('should login existing google user', async () => {
            const googleUser = { email: 'google@test.com', name: 'Google User', avatar_url: 'pic.jpg', google_id: '123' };
            const user = { id: '1', ...googleUser, role: 'user' };

            usersService.findByEmail.mockResolvedValue(user);
            jwtService.sign.mockReturnValue('token');

            const result = await service.googleLogin(googleUser);

            expect(usersService.create).not.toHaveBeenCalled();
            expect(result).toEqual({
                access_token: 'token',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                },
            });
        });

        it('should create and login new google user', async () => {
            const googleUser = { email: 'new@google.com', name: 'New Google', avatar_url: 'pic.jpg', google_id: '456' };
            const newUser = { id: '2', ...googleUser, role: 'user' };

            usersService.findByEmail.mockRejectedValue(new Error('Not found'));
            usersService.create.mockResolvedValue(newUser);
            jwtService.sign.mockReturnValue('token');

            const result = await service.googleLogin(googleUser);

            expect(usersService.create).toHaveBeenCalledWith({
                name: googleUser.name,
                email: googleUser.email,
                avatar_url: googleUser.avatar_url,
                google_id: googleUser.google_id,
            });
            expect(result.user.id).toBe('2');
        });
    });
});

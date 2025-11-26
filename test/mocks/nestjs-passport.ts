export function AuthGuard(strategy?: string): any {
  return class MockAuthGuard {
    canActivate() {
      return true;
    }
  };
}

export class PassportModule {
  static register(options?: any): any {
    return {
      module: PassportModule,
      providers: [],
      exports: [],
    };
  }

  static registerAsync(options?: any): any {
    return {
      module: PassportModule,
      providers: [],
      exports: [],
    };
  }
}

export function PassportStrategy(Strategy: any, name?: string): any {
  return class MockPassportStrategy {
    constructor(...args: any[]) {}
    validate(...args: any[]): any {
      return {};
    }
  };
}

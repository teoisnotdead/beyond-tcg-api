export function AuthGuard(strategy?: string): any {
  return class MockAuthGuard {
    canActivate() {
      return true;
    }
  };
}

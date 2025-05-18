export class UserRegisteredEvent {
  constructor(public readonly userId: string) {}
}

export class UserSubscriptionChangedEvent {
  constructor(public readonly userId: string, public readonly newPlan: string) {}
} 
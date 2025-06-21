// Global state management for preventing multiple GitHub Actions
class GlobalStateManager {
  private static instance: GlobalStateManager;
  private lastGitHubActionTime: number = 0;
  private readonly GITHUB_ACTION_COOLDOWN = 60000; // 1 minute in milliseconds

  private constructor() {}

  static getInstance(): GlobalStateManager {
    if (!GlobalStateManager.instance) {
      GlobalStateManager.instance = new GlobalStateManager();
    }
    return GlobalStateManager.instance;
  }

  /**
   * Check if enough time has passed since the last GitHub Action
   * @returns {boolean} true if action can proceed, false if still in cooldown
   */
  canTriggerGitHubAction(): boolean {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastGitHubActionTime;
    
    console.log(`🕐 Time since last GitHub Action: ${Math.round(timeSinceLastAction / 1000)}s`);
    console.log(`🕐 Required cooldown: ${this.GITHUB_ACTION_COOLDOWN / 1000}s`);
    
    return timeSinceLastAction >= this.GITHUB_ACTION_COOLDOWN;
  }

  /**
   * Get remaining cooldown time in seconds
   * @returns {number} seconds remaining in cooldown, 0 if no cooldown
   */
  getRemainingCooldown(): number {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastGitHubActionTime;
    const remainingTime = this.GITHUB_ACTION_COOLDOWN - timeSinceLastAction;
    
    return remainingTime > 0 ? Math.ceil(remainingTime / 1000) : 0;
  }

  /**
   * Mark that a GitHub Action has been triggered
   */
  markGitHubActionTriggered(): void {
    this.lastGitHubActionTime = Date.now();
    console.log(`✅ GitHub Action timestamp updated: ${new Date().toISOString()}`);
  }

  /**
   * Reset the cooldown (for testing or manual override)
   */
  resetCooldown(): void {
    this.lastGitHubActionTime = 0;
    console.log('🔄 GitHub Action cooldown reset');
  }

  /**
   * Get the last action time as a readable date
   */
  getLastActionTime(): Date | null {
    return this.lastGitHubActionTime > 0 ? new Date(this.lastGitHubActionTime) : null;
  }
}

export const globalState = GlobalStateManager.getInstance();
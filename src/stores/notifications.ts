import { defineStore } from 'pinia'
import { useCoreStore } from './core'
import type { Alert } from '@/interfaces/Alert'
import type { PaginatedGroupedQuery } from '@/interfaces/Queries'

export const useNotificationsStore = defineStore('notifications', {
  state: () => {
    return {
      notifications: [] as Alert[],
      count: 0,
      limit: 5,
      paginatedNotifications: [] as Alert[],
      paginatedCount: 0,
    }
  },
  actions: {
    async deleteNotification(id: number) {
      const core = useCoreStore()
      core.isSpinning = true
      try {
        await core.$api.alerts.delete(id)
        core.toast('Notification deleted', 'success')
      } catch {
        core.toast('Error deleting notification', 'error')
      } finally {
        core.isSpinning = false
      }
    },
    async getDisplayNotifications() {
      const core = useCoreStore()
      core.isSpinning = true
      try {
        const { data } = await core.$api.alerts.get()
        this.notifications = data.alerts
      } catch {
        core.toast('Error fetching notifications', 'error')
      } finally {
        core.isSpinning = false
      }
    },
    async getPaginatedNotifications(args: PaginatedGroupedQuery) {
      const core = useCoreStore()
      core.isSpinning = true
      try {
        const { data } = await core.$api.alerts.getPaginated(args)
        this.paginatedNotifications = data.alerts
        this.paginatedCount = data.total
      } catch {
        core.toast('Error fetching notifications', 'error')
      } finally {
        core.isSpinning = false
      }
    },
  },
})

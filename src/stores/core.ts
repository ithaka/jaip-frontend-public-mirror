import { defineStore } from 'pinia'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { ToastStatus } from '@ithaka/pharos/lib/components/toast/pharos-toast'
import type ApiObject from '@/interfaces/ApiObject'
import type Alert from '@/interfaces/Alert'

export const useCoreStore = defineStore('core', {
  state: () => {
    const stored = localStorage.getItem('requests') || ''
    const reqs = stored ? JSON.parse(stored) : []
    return {
      reqs: reqs,
      helpTab: 0,
      subdomain: '',
      customSubdomains: [] as string[],
      base_test_url: 'https://test-pep.jstor.org',
      ephemeral_student_ending: 'student.apps.test.cirrostratus.org',
      ephemeral_admin_ending: 'admin.apps.test.cirrostratus.org',
      adminSubdomains: ['pep-admin', 'admin.pep', 'admin.test-pep'],
      studentSubdomain: 'pep',
      routePath: '/',
      routeQuery: '',
      toastKey: 0,
      environment: '',
      $api: {} as ApiObject,
      alert: {} as Alert,
    }
  },
  getters: {
    validSubdomains(): string[] {
      return [...this.customSubdomains, ...this.adminSubdomains, this.studentSubdomain]
    },
    isEphemeralStudent(): boolean {
      return window.location.hostname.endsWith(this.ephemeral_student_ending)
    },
    isEphemeralAdmin(): boolean {
      return window.location.hostname.endsWith(this.ephemeral_admin_ending)
    },
    hasValidSubdomain(): boolean {
      return (
        this.validSubdomains.includes(this.subdomain) ||
        this.isEphemeralAdmin ||
        this.isEphemeralStudent
      )
    },
    hasValidStudentSubdomain(): boolean {
      return (
        this.validSubdomains.includes(this.subdomain) &&
        (!this.adminSubdomains.includes(this.subdomain) || this.isEphemeralStudent)
      )
    },
    isAdminSubdomain(): boolean {
      return this.adminSubdomains.includes(this.subdomain) || this.isEphemeralAdmin
    },
  },
  actions: {
    saveReqs(reqs: MediaRecord[]) {
      this.reqs = reqs
      localStorage.setItem('requests', JSON.stringify(reqs))
    },
    addRequest(article: string) {
      let reqList = []
      if (this.reqs.length > 0) {
        reqList = this.reqs.slice(0)
      }
      reqList.push(article)
      this.saveReqs(reqList)
    },
    removeRequest(article: string) {
      const reqList = this.reqs.slice(0)
      reqList.splice(reqList.indexOf(article), 1)
      this.saveReqs(reqList)
    },
    toast(msg: string, status: ToastStatus) {
      const open = new CustomEvent('pharos-toast-open', {
        detail: {
          content: msg,
          status,
        },
      })
      document.dispatchEvent(open)
      // This is a bit ugly, but the pharos component seems to have an uncaught typeerror that prevents
      // it from closing normally. This avoids that by rerending to its default state (i.e., off).
      setTimeout(() => {
        this.toastKey++
      }, 5000)
    },
  },
})

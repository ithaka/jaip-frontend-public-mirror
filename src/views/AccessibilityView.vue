<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)

const coreStore = useCoreStore()

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <div>
    <pep-pharos-layout row-gap="0">
      <div class="accessibility">
        <pep-pharos-heading class="accessibility__heading" :level="1" preset="5--bold"
          >Accessibility Statement</pep-pharos-heading
        >
        <p>
          JSTOR Access in Prison and JSTOR Labs are committed to ensuring digital accessibility for
          people with disabilities. We are continually improving the user experience for everyone,
          and applying the relevant accessibility standards and best practices.
        </p>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Conformance status</pep-pharos-heading
        >
        <p>
          The
          <span v-if="isAuthenticatedAdmin">
            <pep-pharos-link href="https://www.w3.org/WAI/standards-guidelines/wcag/"
              >Web Content Accessibility Guidelines (WCAG)</pep-pharos-link
            >
          </span>
          <span v-else> Web Content Accessibility Guidelines (WCAG) </span>
          defines requirements for designers and developers to make web content more accessible for
          people with disabilities. It defines three levels of conformance: Level A, Level AA, and
          Level AAA. JSTOR Access in Prison aims to meet WCAG 2.2 Level AA conformance and is
          compliant to the extent described in this Accessibility Statement.
        </p>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Feedback</pep-pharos-heading
        >
        <p>
          We welcome your feedback on the accessibility of JSTOR Access in Prison. Please let us
          know if you encounter accessibility barriers:
        </p>
        <p>
          Email:
          <pep-pharos-link v-if="isAuthenticatedAdmin" :href="`mailto:${coreStore.supportEmail}`">{{
            coreStore.supportEmail.replace('@', '[at]')
          }}</pep-pharos-link>
          <span v-else>{{ coreStore.supportEmail.replace('@', '[at]') }}</span>
        </p>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Compatibility with browsers and assistive technology</pep-pharos-heading
        >
        <p>
          JSTOR Access in Prison is designed to be compatible with assistive technologies and the
          last two versions of major browsers.
        </p>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Technical Specifications</pep-pharos-heading
        >
        <p>
          There are no barriers to accessing the core functionality of JSTOR Access in Prison.
          However, in an effort of transparency we have identified instances of specific WCAG
          Success Criteria failures that may cause a less than desirable experience. We are tracking
          their remediation with an internal issue management platform and are prioritizing them
          according to severity and user impact. The timeline for remediation is listed along with
          the known issue.
        </p>
        <ul class="accessibility__known-issues">
          <li>
            Due to the nature of a single page application, there are some focus management issues
            where content updates without a page refresh and focus or current status isn’t updated
            accordingly. Users are able to recover and continue with their flow and nothing is
            blocked. Remediation is currently underway with a fix coming in Q4.
          </li>
        </ul>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Assessment approach</pep-pharos-heading
        >
        <p>
          ITHAKA & JSTOR Labs assessed the accessibility of the JSTOR Access in Prison website by
          self-evaluation. Remediation and validation of issues found is currently in progress.
        </p>
        <div class="accessibility__evaluation-methods">
          <span>Evaluation Methods Used:</span>
          <ul>
            <li>
              MacOS
              <ul>
                <li>VoiceOver + Safari/Chrome/Firefox</li>
              </ul>
            </li>
            <li>
              Windows
              <ul>
                <li>NVDA + Chromium Edge/Firefox</li>
                <li>JAWS 2023 + Chromium Edge/Firefox</li>
                <li>Color Contrast Analyzer Tool</li>
                <li>ANDI</li>
                <li>Axe DevTools</li>
                <li>Text spacing bookmarklet</li>
                <li>Keyboard-only</li>
              </ul>
            </li>
          </ul>
        </div>
        <pep-pharos-heading class="accessibility__heading" :level="2" preset="4--bold"
          >Formal approval of this accessibility statement</pep-pharos-heading
        >
        <p>
          This Accessibility Statement is approved by Mat Harris (WAS), Web Accessibility Lead,
          Product & Design, ITHAKA
        </p>
      </div>
    </pep-pharos-layout>
  </div>
</template>

<style scoped lang="scss">
.accessibility {
  grid-column: span 12;
  &__heading {
    margin-top: var (--pharos-spacing-2-x);
  }
  p {
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
  }
  &__known-issues {
    margin-left: var(--pharos-spacing-3-x);
    margin-bottom: var(--pharos-spacing-2-x);
    li {
      list-style-type: disc;
    }
  }
  &__evaluation-methods {
    margin-bottom: var(--pharos-spacing-2-x);
    ul {
      margin-top: var(--pharos-spacing-one-quarter-x);
      margin-left: var(--pharos-spacing-3-x);
      li {
        list-style-type: disc;
        ul {
          margin-left: var(--pharos-spacing-3-x);
          li {
            list-style-type: circle;
          }
        }
      }
    }
  }

  @media screen and (max-width: 768px) {
    grid-column: span 8;
  }
  @media screen and (max-width: 360px) {
    grid-column: span 4;
  }
}
</style>

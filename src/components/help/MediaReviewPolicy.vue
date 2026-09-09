<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { useLogger } from '@/composables/logging/useLogger'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const router = useRouter()
const { isAuthenticatedAdmin } = storeToRefs(useUserStore())
const { handleWithLog, logs } = useLogger()
const { backToHelpGuideLog } = logs.getMediaReviewHelpLogs()

const { logPageView } = usePageViewLogger()
logPageView()

const goBackToHelpGuide = () => {
  handleWithLog(backToHelpGuideLog, () => {
    if (isAuthenticatedAdmin.value) {
      router.push({ path: '/help/admin-media-review-help' })
    } else {
      router.push({ name: 'help', params: { tab: 'unavailable-items' }, hash: '#help-tabs' })
    }
  })
}
</script>

<template>
  <pep-pharos-layout row-gap="0">
    <div class="media-review-policy">
      <div class="media-review-policy__back">
        <pep-pharos-link
          flex
          class="media-review-policy__back-link"
          data-cy="media-review-back-link"
          @click.prevent="goBackToHelpGuide"
        >
          <pep-pharos-icon
            class="media-review-policy__back-icon"
            name="arrow-left"
            a11y-hidden="true"
          >
          </pep-pharos-icon>
          Back to help guide
        </pep-pharos-link>
      </div>
      <div class="media-review-policy__content">
        <pep-pharos-heading :level="2" preset="4--bold" class="media-review-policy__title">
          Appendix: Model Media Review Policy
        </pep-pharos-heading>
        <p class="media-review-policy__authors">Ess Pokornowski, Kurtis Tanaka, Darnell Epps</p>
        <p class="media-review-policy__date">April 20, 2023</p>
        <p class="media-review-policy__source">
          From: <em>Security and Censorship</em>, ITHAKA S+R (2023)
        </p>
        <div class="media-review-policy__body">
          <p>
            This Media Review Model Policy incorporates the recommendations outlined in our report,
            "Security and Censorship: A Comparative Analysis of State Department of Corrections
            Media Review Policies," and builds on existing policies and procedures. The model policy
            collates and cites features from existing media review directives, synthesizing some of
            the most precise policies that promote security while maintaining student or reader
            rights. In providing this synthetic sample policy, we aim to concisely demonstrate how
            existing policy already exemplifies our recommendations, and to provide model policy in
            a brief, coherent design that can easily be cited or sampled.
          </p>
          <p>
            The model policy features nine distinct sections focusing on different aspects of the
            media review process. The policy will appear familiar in both structure and content to
            readers who have examined media review directives, with the exception of the
            significantly expanded first and last sections, Policy Purpose and Goals and Training
            Materials, respectively. Linguistically, we have chosen language that operates at the
            facility level for two reasons: (1) for the sake of streamlining language and (2) as a
            means to ensure balanced representation in Publication Review Committees across all
            facilities. This structure is not intended as a value judgment, and we do not wish to
            imply that facility-level review policy is more or less valid or valuable than
            system-level policy. Moreover, we recognize that Department of Corrections media review
            structures vary by system and that some states will be required to establish publication
            review committees at a system-wide level, rather than at the level of facility.
          </p>
          <p>
            We provide this model policy as researchers familiar with the broad landscape of media
            review policy who are invested in making trends across that landscape legible.
          </p>
          <p class="media-review-policy__citation">
            1 Steve Pokornowski, Kurtis Tanaka, and Darnell Epps, "Security and Censorship: A
            Comparative Analysis of State Department of Corrections Media Review Policies," Ithaka
            S+R. 20 April 2023. https://doi.org/10.18665/sr.318751
          </p>
          1. Policy Purpose and Goals
          <p class="media-review-policy__indented media-review-policy__indented--2">
            1.1. It is Department policy to encourage and facilitate access to publications to
            promote recreational reading, personal enrichment, and education, both formal and
            informal, among those in the Department’s custody. As a growing body of evidence makes
            clear, access to such resources promotes security and good order, fosters an atmosphere
            of mutual respect, and promotes conditions conducive to personal growth.<sup
              ><sup
                ><a id="post-318735-footnote-ref-1" href="#post-318735-footnote-1">[1]</a></sup
              ></sup
            >
            The Department’s goals in exercising media review are therefore:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.1. To provide persons in custody the opportunity to explore ideas, information, and
            concepts originating outside the institution;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.2. To maintain family and community ties;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.3. To facilitate communication with courts and legal counsel;<sup
              ><sup
                ><a id="post-318735-footnote-ref-2" href="#post-318735-footnote-2">[2]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.4. To support recreational reading, personal enrichment, and lifelong learning;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.5. To support formal educational programming by facilitating access to academic
            resources;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            1.1.6. To maintain a safe environment for both persons in custody and staff.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            1.2. Accordingly, persons in custody shall be allowed to subscribe to and possess a wide
            range of printed material such as books, magazines, and newspapers, subject to the
            provisions of this directive.<sup
              ><sup
                ><a id="post-318735-footnote-ref-3" href="#post-318735-footnote-3">[3]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            1.3. Likewise, programs serving the Department’s facilities shall be allowed to provide
            access to reading and educational materials, subject to the provisions of this
            directive.
          </p>
          2. Terms and Definitions
          <p class="media-review-policy__indented media-review-policy__indented--2">
            2.1. Security, Good Order, Discipline, or Rehabilitation
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            2.1.1. The Department recognizes that its legal power to censor material and restrict
            the rights of residents comes specifically from circumstances that threaten security,
            good order, discipline, or rehabilitation. In the aim of transparency and consistency,
            the Department understands threats to security, good order, discipline, or
            rehabilitation in the following terms:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.1.1. Threats to security: tangible, imminent threats to the security of the facility
            may endanger the rehabilitation of residents or the health, privacy, or safety of staff
            or residents, must be corroborated by evidence and not based on speculation.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.1.2. Threats to good order: tangible, imminent threats to the operation of essential
            programming in the facility, must be corroborated by evidence and not based on
            speculation.<sup
              ><sup
                ><a id="post-318735-footnote-ref-4" href="#post-318735-footnote-4">[4]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.1.3. Threats to discipline: tangible, imminent threats to the working operation of
            the facility, such as escape attempts, organized smuggling of contraband, violence, or
            riots; must be corroborated by evidence and not based on speculation.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.1.4. Threats to rehabilitation: tangible, imminent threats to the rehabilitation of
            residents, including large-scale or systematic disruptions of counseling or therapeutic
            services, must be corroborated by evidence and not based on speculation.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            2.1.2. Examples of justified and unjustified censorship under these definitions might
            include the following:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.2.1.Unjustified censorship might include: Rejecting a publication because it
            addresses the history of systemic racism in the United States and has a chapter focusing
            on incarceration.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--5">
            2.1.2.1.1. While a sensitive topic, the above subject matter will not necessarily lead
            to violence or disruption.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            2.1.2.2. Justified censorship might include: Rejecting a publication that provides
            detailed instructions on how to disrupt security systems or how to wage guerrilla
            warfare in confined spaces.
          </p>
          3. Publication Review Committee (PRC) Guidelines and Procedures
          <p class="media-review-policy__indented media-review-policy__indented--1">
            3.1. PRC Members and Training
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            3.1.1. Each facility shall establish a Publication Review Committee consisting of:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.1.1.1. a trained librarian, and at least one representative from each of the following
            areas: Programs, Custody/Security, Counseling and Mental or Behavioral Health. If
            applicable, the committee will also include a representative faculty member or
            administrator from affiliated higher education in prison programs. The administrative
            head will designate a committee chair.<sup
              ><sup
                ><a id="post-318735-footnote-ref-5" href="#post-318735-footnote-5">[5]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            3.1.2. All persons who perform media review, including the Publication Review Committee
            members, will participate in yearly First Amendment rights, censorship guidelines, and
            unconscious or implicit bias seminars.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            3.2. Publication Review Procedures
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            3.2.1. Initial Review
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.1.1. Incoming publications will be screened in accordance with the Department’s
            goals outlined in Section 1 of this directive. Publications shall generally be approved
            unless matter in the specific publication falls into one of the guidelines outlined in
            section 7.3, “Censorship Guidelines.”
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            3.2.2. Automatic Appeals<sup
              ><sup
                ><a id="post-318735-footnote-ref-6" href="#post-318735-footnote-6">[6]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.1. When a staff member reviews and denies a publication that does not appear on
            the Department’s Reviewed Publication List, they must:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            3.2.2.1.1. (1) complete the [relevant form] by entering the following:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--5">
            3.2.2.1.1.1. (a) publication name, if known, or a brief description of the publication;
            (b) date of the publication; (c) publisher’s name and complete mailing address; (d)
            reason(s) that the publication was denied with brief narrative why the contents violates
            the policy, including page numbers; and (e) within two business days, notify the
            resident that the automatic appeals process has been triggered by placing a completed
            copy of [relevant form] in the institutional mail system at the same time that they
            initiate the automatic appeals process and notify the PRC. If the PRC determines that
            the publication must be censored or rejected, they will notify the resident with
            [relevant form] and provide notice to the publisher using [relevant form].
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.2. Publication review officers must make available to the PRC the [relevant form]
            justifying the censorship decision and the material to be censored.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.3. Within 15 business days of receipt of the appeal, the PRC is to review the
            publication to determine if the censorship was appropriate and consistent with the
            Department’s goals and policy.<sup
              ><sup
                ><a id="post-318735-footnote-ref-7" href="#post-318735-footnote-7">[7]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.4. Materials censored by the PRC may be considered under appeal again under any
            one of the following conditions:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            3.2.2.4.1. (1) a new, revised or edited version of the material that addresses committee
            concerns is purchased;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            3.2.2.4.2. (2) relevant censorship policy changes, suggesting the text may be allowed
            under the revised policy;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            3.2.2.4.3. (3) the material was reviewed more than one calendar year ago.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.5. When a publication has been approved on appeal, it will be added to the
            Reviewed Publication List as approved.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            3.2.2.6. When a publication has been censored it must be added to the Reviewed
            Publication List as censored.
          </p>
          4. Reviewed Publication Lists<sup
            ><sup
              ><a id="post-318735-footnote-ref-8" href="#post-318735-footnote-8">[8]</a></sup
            ></sup
          >
          <p class="media-review-policy__indented media-review-policy__indented--1">
            4.1. In order to promote transparency and improve communication about censorship
            decisions, a Reviewed Publication List will be maintained electronically by the PRC at
            each facility.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            4.2. The Reviewed Publication List must contain the following information:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            4.2.1. Bibliographic information about all books reviewed for censorship;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            4.2.2. Clear information about whether the book was accepted or rejected after review;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            4.2.3. The rationale stated for acceptance or rejection.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            4.2.3.1. If the publication is rejected, it must also include a note detailing which
            censorship guideline it was rejected under and, in the case of content-based
            prohibitions, where in the book offending material may be found.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            4.3. The Reviewed Publication List must be electronically accessible to all members of
            the PRC and any staff who participate in the review process. It must also be readily
            accessible to all residents in print; posted in common spaces, libraries, and mailrooms;
            and distributed directly to residents quarterly.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            4.4. The Reviewed Publication List for each facility will also be publicly available at
            the DOC website, and lists for each facility will be updated at least quarterly.
          </p>
          5. Vendors, Purchasing, and Shipping
          <p class="media-review-policy__indented media-review-policy__indented--1">
            5.1. In order to protect the right of individuals to choose where to spend their money,
            and to allow residents to find affordable texts: so long as purchases are legally made
            through a vendor, publisher, bookstore, or other bookseller, there shall be no
            limitations on where publications may be purchased or through which carrier they may be
            shipped, with the following exceptions.<sup
              ><sup
                ><a id="post-318735-footnote-ref-9" href="#post-318735-footnote-9">[9]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            5.1.1. If a particular vendor or seller has a proven record of sending or allowing
            contraband, they may be disqualified as a source.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            5.1.2. Donated or gifted books may come from any source and may be sent to individuals
            or to the facility library. Visitors may bring books to gift or donate and hand deliver
            them
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            5.1.2.1. Donated or gifted books are still subject to search and censorship.
          </p>
          6. Property Dimensions and Specifications
          <p class="media-review-policy__indented media-review-policy__indented--1">
            6.1. Quantity.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.1.1. There is no limit to the number of publications that a resident may purchase, or
            be gifted, and property limits will be determined by one’s ability to safely store
            publications.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.1.2. Books may be allowed as long as they fit in a locker, on a shelf, under a bed, or
            in other areas designated for safe storage, that do not create fire hazards.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.1.3. Residents who possess publications that cannot be safely stored will have the
            following options available:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            6.1.3.1. (1) Residents may gift or trade books in an authorized exchange,
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            6.1.3.1.1. Books are subject to contraband searches before exchange.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            6.1.3.2. (2) Residents may choose to donate their books to the facility library;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            6.1.3.2.1. If the book is already in library holdings, copies deemed in excess by
            facility library staff may be automatically donated to other facilities in the system.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            6.2. Bindings.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.2.1. With the exception of staples, metal bindings on publications are not permitted.
            Metal bindings include: paperclips, binder clips, or other metal fasteners. Staples may
            not be permitted in mental health in-patient housing, including transitional care units,
            crisis stabilization units, and correctional mental health treatment facilities.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">6.3. Covers.</p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.3.1. Covers may only be made of paper or leather materials. Covers cannot be made of
            metal or contain metal.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            6.3.2. As long as they do not also have metal or wooden components, hardcover books are
            allowed, as the covers of such books are typically made from paper products.
          </p>
          7. Content-Based Publication and Media Prohibitions
          <p class="media-review-policy__indented media-review-policy__indented--1">
            7.1. Policy Overview
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.1.1. The Department recognizes the rights of individuals incarcerated within its
            system to access information, moreover, The Department understands the importance of
            publications and education for rehabilitation and reentry. At the same time, The
            Department must balance its duty to protect and foster these individual rights with its
            duty to maintain secure facilities and safe operating environments for staff,
            administrators, and people incarcerated within the system.<sup
              ><sup
                ><a id="post-318735-footnote-ref-10" href="#post-318735-footnote-10">[10]</a></sup
              ></sup
            >
            Given this, publications are subject to inspection and, though the default is to allow
            publications, in exceptional circumstances they may be rejected under the criteria
            provided in Section 7.3.<sup
              ><sup
                ><a id="post-318735-footnote-ref-11" href="#post-318735-footnote-11">[11]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            7.2. Protected Content
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.2.1. The prohibitions below shall not apply to educational materials used in
            association with any operating educational programs or in the case of patently medical,
            artistic, anthropological, or educational commercial publications, including, but not
            limited to such publications as National Geographic, works of art displayed in public
            galleries, anatomy texts, or comparable materials.<sup
              ><sup
                ><a id="post-318735-footnote-ref-12" href="#post-318735-footnote-12">[12]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.2.2. No publication shall be denied solely on the basis of its appeal to a particular
            ethnic, racial, religious, or political group.<sup
              ><sup
                ><a id="post-318735-footnote-ref-13" href="#post-318735-footnote-13">[13]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.2.3. Publications which discuss different political philosophies and those dealing
            with criticism of Governmental and Departmental authority are acceptable as reading
            material, provided they do not violate the above guidelines. For example, publications
            such as Fortune News, The Militant, The Torch/La Antorcha, Workers World, and
            Revolutionary Worker shall generally be approved unless matter in a specific issue is
            found to violate the above guidelines.<sup
              ><sup
                ><a id="post-318735-footnote-ref-14" href="#post-318735-footnote-14">[14]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            7.3. Censorship Guidelines
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.3.1. The Department’s rejection of incoming materials will be limited only to those
            publications deemed to be substantially dangerous to the security of the facility, the
            good working order of programming, or the safety of residents or staff, as laid out
            under Section 7.3.2. Such determinations must be based in fact and have corroborating
            evidence. Suspicion and speculation of possible effects are not justifiable grounds for
            censorship.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            7.3.2. Publications with the following information may be rejected:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.1. Instructions on how to create contraband, including weapons or explosives,
            alcohol or intoxicants, or harmful substances (such as poisons);
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.1.1. Note—publications describing or portraying these materials without providing
            tangible insights on how to create them will not be censored.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.2. Instruction in tactical, military, or martial arts;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.2.1. Note—publications merely depicting fictional combat are not subject to this
            prohibition. E.g. J.R.R. Tolkien’s <em>The Two Towers</em>, which features fictional
            combat between fantasy creatures would not be subject to this prohibition; however, Jay
            McCullough’s
            <em>Ultimate Guide to U.S. Army Combat Skills, Tactics, and Techniques</em> would be
            rejected.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.3. Instructions on how to perform body modifications or tattoo someone, or
            instructions on how to create materials needed to perform them;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.3.1. Publications addressing the medical significance, risk, or impact of tattoos
            (whether professional or amateur) will not be excluded under this guideline.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.4. Information that may legitimately incite individual or group violence based on
            the specific dynamics within the facility population;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.4.1. For example: If there are two gangs with members in a facility and a
            publication traces the history of violence between them.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.5. Sexually explicit material may be deemed inadmissible if it is found to
            contribute directly to harassment or the creation of a hostile work environment, or
            there is evidence that it is a detriment to the safety or rehabilitation of residents or
            staff at risk.<sup
              ><sup
                ><a id="post-318735-footnote-ref-15" href="#post-318735-footnote-15">[15]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.6. Information about another resident, their family, or their case;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.7. Content that advocates or calls for violence or disenfranchisement of
            individuals or groups based solely on race, ethnicity, nation of origin, class, sex,
            gender, sexuality, or religion;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.7.1. This means, for example, that literature advocating for racial or ethnic
            genocide will be rejected, but academic explorations of structural inequity, for
            example, may not be censored.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            7.3.2.8. Information that may tangibly and realistically aid in escape, such as maps of
            the surrounding area or instructions on how evade detection in an environment like that
            of the location of the facility or the region;
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--4">
            7.3.2.8.1. Maps of distant locations or fictional terrain are not subject to this
            prohibition. This may not be used to reject publications with fictional depictions of
            escape, or historical depictions of escape that do not have clear, tangible evidence of
            contemporary utility.
          </p>
          8. Exceptions for Educational Materials
          <p class="media-review-policy__indented media-review-policy__indented--1">
            8.1. The Department recognizes that access to a broad range of literary, scholarly, and
            informational materials is an essential part of the educational experience and is
            necessary for a high quality education, especially at the post-secondary level.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            8.1.1. Given the importance of education for rehabilitation and reentry, residents may
            be allowed publications for educational programming which might otherwise be prohibited
            according to the guidelines outlined in section 7.3.<sup
              ><sup
                ><a id="post-318735-footnote-ref-16" href="#post-318735-footnote-16">[16]</a></sup
              ></sup
            >
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            8.2. Therefore, materials brought into the facility for educational purposes, purchased
            by residents for study, or gifted or donated to residents for education are not subject
            to standard content based restrictions. This applies equally to textbooks, course books,
            journals, periodicals, articles, and academic databases, and it includes technical
            manuals and how-to guides, such as program language manuals, etc.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            8.2.1. At the end of the academic term or terms in which they are needed, residents
            must, however, donate or gift materials listed as censored on the Reviewed Publications
            List to future students or to the facility library. Failure to comply with this policy
            will result in the publication being considered contraband.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            8.3. Publications brought in for educational programming may only be denied if they are
            found to contain contraband. In the event that the publication is deemed dangerous for
            specific, material reasons (e.g. metal binding), staff will work with educational
            programs to safely provide the text (e.g. removing the binding and providing a folder).
          </p>
          9. Training Materials
          <p class="media-review-policy__indented media-review-policy__indented--1">
            9.1. The materials provided below are intended as a suggested starting point, not a
            fully-formed curriculum. The most effective training solutions take local and
            institutional contexts and cultures into account and provide concrete and relatable
            examples. Therefore, it is recommended that the DOC partner with external organizations
            specializing in both first amendment rights and mitigating unconscious bias.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            9.2. The Prisoner's Right to Read, Adopted June 29, 2010, by the American Library
            Association Council; amended July 1, 2014; January 29, 2019:
            https://www.ala.org/advocacy/intfreedom/librarybill/interpretations/prisonersrightoread.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--1">
            9.3. Unconscious or Implicit Bias Seminars have the most impact when they are developed
            to address specific institutional contexts, histories, and needs; however, such bespoke
            services can be expensive. There are existing, freely provided resources, however, that
            may be of use:
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            9.3.1. The National Equity Project, a nonprofit organization, provides both free and
            bespoke sessions on implicit-bias and structural racism.
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            9.3.1.1. More information about the specific implicit bias programming they offer is
            available here:
            https://www.nationalequityproject.org/training/implicit-bias-and-structural-racism
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--3">
            9.3.1.2. A general, free session is available here:
            https://www.nationalequityproject.org/free-webinars/implicit-bias
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            9.3.2. The National Institute of Health has a science-based implicit bias course
            available on their website. The drawback to this resources that it is designed for
            scientists:
            https://diversity.nih.gov/sociocultural-factors/implicit-bias-training-course
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            9.3.3. The Racial Equity Institute is another nonprofit that provides intensive,
            science- and history-based training and education, though their focus is more narrowly
            aimed at structural racism: https://racialequityinstitute.org/our-services/
          </p>
          <p class="media-review-policy__indented media-review-policy__indented--2">
            9.3.4. Unconscious Bias Project provides consulting services to help discover and
            address unconscious bias. They also have a robust resources page
            (https://www.unconsciousbiasproject.org/) and a thorough list of external resources
            (https://docs.google.com/document/d/190MX5-xm-eJrY7mGG39kIYu91W6Ih_C7KQKMxVukg3s/edit)
          </p>
          &nbsp;
          <h3>Notes</h3>
          <ol>
            <li class="media-review-policy__list-item media-review-policy__list-item--plain">
              <ol>
                <li class="media-review-policy__list-item media-review-policy__list-item--plain">
                  <ol class="media-review-policy__footnotes">
                    <li id="post-318735-footnote-1">
                      Adapted from: New Jersey Department of Corrections, <em>Inmate Handbook</em>,
                      retrieved from University of Michigan Policy Clearing House,
                      https://www.law.umich.edu/special/policyclearinghouse/Documents/New%20Jersey%20Inmate%20Handbook.pdf.
                      <a href="#post-318735-footnote-ref-1">↑</a>
                    </li>
                    <li id="post-318735-footnote-2">
                      1.1.1.-1.1.3. Adapted from Idaho Department of Correction, “Mail Handling in
                      Correctional Facilities,” Standard Operating Procedures, Control Number
                      402.02.01.001, adopted 1 January 1991, version 14 approved 11 March 2018.
                      <a href="#post-318735-footnote-ref-2">↑</a>
                    </li>
                    <li id="post-318735-footnote-3">
                      1.2 Adapted from New York Corrections and Community Supervision, Directive
                      Number 4572, “Media Review,” effective date 27 January 2022.
                      <a href="#post-318735-footnote-ref-3">↑</a>
                    </li>
                    <li id="post-318735-footnote-4">
                      Given how much policy around labor organization and work stoppages vary by
                      state, we did not delve into those issues in this policy; however, we would
                      encourage carceral systems to follow state laws and regulations regarding
                      unions, strikes, and labor stoppages.
                      <a href="#post-318735-footnote-ref-4">↑</a>
                    </li>
                    <li id="post-318735-footnote-5">
                      3.1.1.1. Adapted from committee requirements laid out in CO’s and NY’s
                      policies: Colorado Department of Corrections, “Publications,” Administrative
                      Regulation Number 300-26, effective 1 February 2021; New York, “Media Review.”
                      <a href="#post-318735-footnote-ref-5">↑</a>
                    </li>
                    <li id="post-318735-footnote-6">
                      3.2.2. Automatic Appeals is adapted from the automatic appeals process laid
                      out in Kansas Department of Corrections, “Security and Control: Uniform Review
                      of Publications,” <em>Internal Management Policy and Procedures</em>, IMPP#
                      12-134A, effective 6 December 2021. The proposed process is adjusted with
                      additional information drawing on Pennsylvania’s and New York’s policies:
                      Commonwealth of Pennsylvania Department of Corrections, DC-ADM 803, “Inmate
                      Mail and Incoming Publications;” and New York, “Media Review.”
                      <a href="#post-318735-footnote-ref-6">↑</a>
                    </li>
                    <li id="post-318735-footnote-7">
                      3.2.2.2. Adapted from Kansas, “Security and Control,” original policy is 30
                      days, but 3.2.2.2. Has been adjusted to align more closely with the PRC
                      meeting requirements outlined above.
                      <a href="#post-318735-footnote-ref-7">↑</a>
                    </li>
                    <li id="post-318735-footnote-8">
                      4. Adapted from Iowa Department of Corrections, “Incoming Publications,”
                      Policy and Procedures, Iowa Code Reference 904.310A, Administrative Code
                      Reference 201-20.6 and Pennsylvania, “Inmate Mail and Incoming Publications,”
                      with additions to increase specificity and transparency.
                      <a href="#post-318735-footnote-ref-8">↑</a>
                    </li>
                    <li id="post-318735-footnote-9">
                      If DOCs find themselves unable or unwilling to implement such an ambitious
                      policy, we recommend that they provide educational exceptions to vendor and
                      donor limitations, to ensure that students have affordable access to needed
                      educational materials. <a href="#post-318735-footnote-ref-9">↑</a>
                    </li>
                    <li id="post-318735-footnote-10">
                      Adapted from Colorado Department of Corrections, “Publications,”
                      Administrative Regulation Number 300-26, effective 1 February 2021, with
                      additional details.
                      <a href="#post-318735-footnote-ref-10">↑</a>
                    </li>
                    <li id="post-318735-footnote-11">
                      Adapted from Arkansas Department of Correction, “Publications,” Administrative
                      Directive 17-17, effective 30 June 2017.
                      <a href="#post-318735-footnote-ref-11">↑</a>
                    </li>
                    <li id="post-318735-footnote-12">
                      7.2.1. Adapted from South Carolina Department of Corrections, PS-10.08,
                      “Inmate Correspondence Privileges,” 19.1.6.
                      <a href="#post-318735-footnote-ref-12">↑</a>
                    </li>
                    <li id="post-318735-footnote-13">
                      Adapted from State of Iowa Department of Corrections, “Incoming Publications,”
                      Policy and Procedures, Iowa Code Reference 904.310A, Administrative Code
                      Reference 201-20.6 <a href="#post-318735-footnote-ref-13">↑</a>
                    </li>
                    <li id="post-318735-footnote-14">
                      Adapted from New York, “Media Review.”
                      <a href="#post-318735-footnote-ref-14">↑</a>
                    </li>
                    <li id="post-318735-footnote-15">
                      According to the United States Equal Employment Opportunity Commission (EEOC):
                      “Harassment is unwelcome conduct that is based on race, color, religion, sex
                      (including sexual orientation, gender identity, or pregnancy), national
                      origin, older age (beginning at age 40), disability, or genetic information
                      (including family medical history). Harassment becomes unlawful where 1)
                      enduring the offensive conduct becomes a condition of continued employment, or
                      2) the conduct is severe or pervasive enough to create a work environment that
                      a reasonable person would consider intimidating, hostile, or abusive.” For
                      more see: “Harassment,” U.S. Equal Employment Opportunity Commission,
                      https://www.eeoc.gov/harassment. A hostile work environment is defined as one
                      where harassment interferes with an individual’s ability to do their duties or
                      creates an intimidating workplace.
                      <a href="#post-318735-footnote-ref-15">↑</a>
                    </li>
                    <li id="post-318735-footnote-16">
                      Adapted from Colorado, “Publications.”
                      <a href="#post-318735-footnote-ref-16">↑</a>
                    </li>
                  </ol>
                </li>
              </ol>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </pep-pharos-layout>
</template>

<style scoped lang="scss">
.media-review-policy {
  display: grid;
  grid-column: span 12;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 0;
  margin-bottom: var(--pharos-spacing-1-x);

  @media screen and (max-width: 1056px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media screen and (max-width: 768px) {
    grid-column: span 8;
  }
  @media screen and (max-width: 360px) {
    grid-column: span 4;
  }

  &__back {
    display: flex;
    grid-column: 2 / -2;
    align-items: center;
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);

    @media screen and (max-width: 1056px) {
      grid-column: 1 / -1;
    }

    &-link {
      gap: var(--pharos-spacing-one-half-x);
    }
  }

  &__content {
    grid-column: 2 / -2;
    margin-top: var(--pharos-spacing-1-x);

    @media screen and (max-width: 1056px) {
      grid-column: 1 / -1;
    }

    &:last-child {
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }

  &__title {
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__authors,
  &__date,
  &__source {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }

  &__date {
    font-weight: 700;
  }

  &__source {
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__body {
    line-height: 1.55;
    word-break: break-word;

    h3 {
      margin-top: var(--pharos-spacing-2-x);
      margin-bottom: var(--pharos-spacing-1-x);
    }

    p,
    ol,
    li {
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }

  &__citation {
    font-size: 0.95rem;
  }

  // Reusable indentation levels for the nested, numbered policy clauses.
  &__indented {
    &--1 {
      padding-left: 2.5rem;
    }
    &--2 {
      padding-left: 5rem;
    }
    &--3 {
      padding-left: 7.5rem;
    }
    &--4 {
      padding-left: 10rem;
    }
    &--5 {
      padding-left: 12.5rem;
    }
  }

  &__list-item {
    &--plain {
      list-style-type: none;
    }
  }

  &__footnotes {
    list-style: decimal;
    padding-left: var(--pharos-spacing-1-x);
    margin-left: var(--pharos-spacing-one-half-x);

    li {
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }
}
</style>

<script setup lang="ts">
import citations from '@/assets/markdown/img/Citations.png'
import Frontandbackmatter from '@/assets/markdown/img/Frontandbackmatter.png'
import Journalcitation from '@/assets/markdown/img/Journalcitation.png'
import BronteSistersdata from '@/assets/markdown/img/BronteSistersdata.png'
import BronteSistersCitation from '@/assets/markdown/img/BronteSistersCitation.png'
import IntextcitationHarris from '@/assets/markdown/img/IntextcitationHarris.png'
import IntextcitationHarrisAPA from '@/assets/markdown/img/IntextcitationHarrisAPA.png'
import LongtextexampleMLA from '@/assets/markdown/img/LongtextexampleMLA.png'
import LongtextexampleAPA from '@/assets/markdown/img/LongtextexampleAPA.png'
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="5--bold">Citing Scholarly Work</pep-pharos-heading>
    <p>
      You’re doing research for a paper on youth voting. You come across two articles that provide
      different numbers for how many young people voted in the most recent election. One source
      quotes a specific expert and includes a list of citations; the other source says that its
      numbers come “from a recent poll.” Which one seems like a more trustworthy source? Why?
    </p>
    <p>
      Citing your sources means that you give credit for the ideas and information you’ve used in
      your paper. It builds credibility and helps readers understand where your ideas come from.
    </p>
    <p>In this lesson, you’ll learn:</p>
    <ul>
      <li>What elements make up a citation</li>
      <li>Where to find the necessary information for a citation</li>
      <li>How to compose your own citations</li>
    </ul>
    <pep-pharos-heading :level="3" preset="4">Why Cite?</pep-pharos-heading>
    <p>
      Citing your sources serves you, and it serves your readers. When you provide citations for the
      work you’ve used in your paper, it gives readers a way to follow up and find more information
      on a topic. A good citation points your readers directly to the source.
    </p>
    <p>
      Using proper citation also gives you credibility as an author. It allows readers to
      distinguish between your ideas and those of your sources.
    </p>
    <pep-pharos-heading :level="3" preset="4">Citation Styles</pep-pharos-heading>
    <p>
      There are a variety of ways to format citations. Citation styles are issued by the major
      professional organizations in a discipline or field. The citation styles are published in
      books called style guides. For example, the Modern Language Association, or MLA, has its own
      citation style that is often used for papers on language, literature, and the humanities. MLA
      is one of the most common styles used in high school. You may also be asked to use APA style,
      issued by the American Psychological Association. There are also special citation styles for
      medicine, legal writing, and journalism that you may encounter in college. If you’re unsure
      which citation style to use, check your assignment or ask your teacher.
    </p>
    <p>
      Most citation styles include the same basic pieces of information, but may require that the
      order or format of those pieces be a little different. For example, some styles use full first
      names, while others use just a first initial. Some styles capitalize every word of a title,
      and some capitalize only the first word. Depending on the style, you may use a period after
      each piece of information, or a comma between some of them. You may need to use a single
      space, or you may need two spaces. These are small details, but it’s important to pay
      attention to them as you create your citations. Formatting your citations correctly and
      consistently tells your readers (and your instructor) that you understand the conventions of
      academic writing.
    </p>
    <figure>
      <img :src="citations" alt="" class="help-tab__image" />
      <figcaption>
        Figure 12: Here, you can see the MLA, APA and Chicago-style versions of citations for the
        same article.
      </figcaption>
    </figure>
    <pep-pharos-heading :level="3" preset="4">Elements of a Citation: Print</pep-pharos-heading>
    <p>
      Print materials include books, popular magazines, and articles from scholarly journals. A
      complete citation for a print source will point your readers to the exact source you used —
      including the correct edition number, page number, or format.
    </p>
    <p>Common elements of a citation include:</p>
    <ul>
      <li>
        The author’s name: Who wrote the work? Usually this is a person or multiple people,but
        sometimes the author is an organization or institution.
      </li>
      <li>
        Title: What is the exact title of the work? If it appears within a larger work—like an
        article in a journal or a chapter in a book—what is the title of the larger work?
      </li>
      <li>
        Publication date: When was the work published? Are there multiple editions or revisions? If
        more than one date is given, use the most recent one in your citation.
      </li>
    </ul>
    <p>
      For both books and journal articles, MLA style requires the author’s name, the publication
      title and/or article title, the publication date, and the format, such as print or web.
    </p>
    <p>
      Books also need the place of publication and the name of the publisher. If more than one place
      is listed, use the first one in your citation. Articles need volume, issue, and page numbers.
    </p>
    <p>
      If you use a library database to download a book or article originally published in print, you
      must include the name of the database you used, the medium (the web, rather than print), and
      the date you accessed the material.
    </p>
    <pep-pharos-heading :level="3" preset="4">Collecting Citation Elements</pep-pharos-heading>
    <p>
      So, where do you start finding the elements of a citation? When you’re looking at a book, you
      can find most or all of these elements at the beginning of the book, on the title page and the
      copyright page.
    </p>
    <figure>
      <img :src="Frontandbackmatter" class="help-tab__image" alt="" />
      <figcaption>Figure 13: Example of a book showing front and back matter.</figcaption>
    </figure>
    <p>
      If you’re looking at a journal article, you can usually find information at the top and bottom
      of the page, and at the beginning or end of the article.
    </p>
    <figure>
      <img :src="Journalcitation" alt="" class="help-tab__image" />
      <figcaption>Figure 14: Example of a journal page showing citation information</figcaption>
    </figure>
    <p>
      The best time to find and record this information for a book or journal is at the beginning of
      your research process. When you’re searching a database, you can find a complete citation for
      each search result. Keep all of this information with your notes for later use.
    </p>
    <p>
      Some databases will also generate a citation in your desired format. Also, consider using
      citation management software to track your sources as you go. Some citation management
      programs are free, and your school may subscribe to others. Ask your teacher or librarian
      about the best citation manager to use.
    </p>
    <pep-pharos-heading :level="3" preset="4">Composing a Citation</pep-pharos-heading>
    <p>
      When it’s time to put together your citations, you’ll need the information you’ve gathered
      about your sources — but you’ll also need information about what is required for a particular
      citation style. Your library or teacher should have a copy of the style guide you need or the
      online version of the style guide.
    </p>
    <p>
      Using your style guide as an example, plug in the information from your source material,
      making sure that all the elements are present. Double-check to be sure you’ve used capital
      letters, italics, and punctuation exactly as your style guide specifies.
    </p>
    <pep-pharos-heading :level="4" preset="2"
      >Examples: Print and Database Sources</pep-pharos-heading
    >
    <p>
      Now that you know where to find the information needed for a citation and how to compose one,
      let’s take a look at some examples.
    </p>
    <p>
      Here’s the database information for an article on the writing of the Brontë sisters. This
      excerpt includes all of the necessary elements of a citation: author, article title, journal
      title, volume and issue number, publication date, and page numbers.
    </p>
    <figure>
      <img class="help-tab__image" alt="" :src="BronteSistersdata" />
      <figcaption>Figure 15: Bronte sisters database info</figcaption>
    </figure>
    <p>
      Now, look at how these elements appear in an MLA and an APA citation. Most of the same
      elements are present in both citations, but you can see that the citations look different: the
      pieces are in a different order, some items (like the author’s name) are formatted
      differently, and different words are capitalized.
    </p>
    <figure>
      <img :src="BronteSistersCitation" class="help-tab__image" alt="" />
      <figcaption>Figure 16: Bronte sisters citation</figcaption>
    </figure>
    <pep-pharos-heading :level="3" preset="4"
      >Citing and paraphrasing a scholarly work</pep-pharos-heading
    >
    <p>
      Now that you understand the elements of a citation, it’s time to take a look at how to
      incorporate citations into the main body of an academic paper.
    </p>
    <p>In this lesson, you will:</p>
    <ul>
      <li>Gain an understanding of when and what to cite in your work</li>
      <li>Learn the difference between quoting, paraphrasing, and summarizing your sources</li>
      <li>Learn how to cite sources within the body of your paper</li>
    </ul>
    <pep-pharos-heading :level="3" preset="4">When to Cite</pep-pharos-heading>
    <p>
      When do you need to cite a source? Each time you incorporate someone else’s information or
      idea into your own work, you must provide a citation. So, even if you are using your own words
      to describe another person’s idea, it’s still necessary to cite.
    </p>
    <p>
      It’s not always necessary to cite facts that are broadly known and accepted. These kinds of
      facts are called “common knowledge.” For example, you don’t need to provide a citation for the
      statement that Washington, D.C. is the capital of the United States. This is a widely known
      fact that can be confirmed in a variety of sources, and it’s something that a good part of the
      population knows.
    </p>
    <p>
      But you would need to cite a statement that the population of Washington, D.C. was 601,723 in
      2010. This number is not common knowledge that most people would be aware of. Providing a
      citation here tells the reader whose statistics you are using.
    </p>
    <p>
      There’s no one set of guidelines about what information constitutes “common knowledge” and
      therefore does not need to be cited. Many experts recommend seeing whether a piece of
      information is available from a variety of sources. If it’s published in a number of places,
      it’s more likely to be common knowledge.
    </p>
    <p>
      Common knowledge also varies between different groups. Think of your audience and ask whether
      this piece of information is something most of them already know.
    </p>
    <p>
      If you are unsure about whether a citation is necessary, it’s always better to provide one.
      It’s much better to cite too heavily than to run the risk of plagiarism.
    </p>
    <pep-pharos-heading :level="3" preset="4">Plagiarism</pep-pharos-heading>
    <p>
      Plagiarism is the use of another person’s words or ideas without providing proper credit. When
      you think of the word “plagiarism,” you might think of someone downloading a paper from the
      Internet or copying a classmate’s work. But plagiarism is often not intentional, and it’s much
      broader than just copying someone else’s work. It can be as simple as:
    </p>
    <ul>
      <li>Failing to include a citation for an idea you’ve restated in your own words</li>
      <li>Paraphrasing in language that is too close to the original, or</li>
      <li>Forgetting to put quotation marks around content from another writer’s work</li>
    </ul>
    <p>
      As a writer, you are responsible for avoiding plagiarism — and there’s really no room for
      accidents. It’s essential to be conscious of giving credit to your sources.
    </p>
    <p>Remember: When in doubt, cite.</p>
    <pep-pharos-heading :level="3" preset="4"
      >Quoting, Paraphrasing, and Summarizing</pep-pharos-heading
    >
    <p>There are different ways to use information from your sources in your own writing.</p>
    <ul>
      <li>
        <strong>Quoting</strong> is the most straightforward: you use another writer’s words exactly
        as they appear in the source material. When you quote a source, you must enclose the quoted
        material in quotation marks. This gives readers a visual cue that these are not your own
        words.
      </li>
      <li>
        <strong>Paraphrasing</strong> means stating someone else’s idea in your own words. When you
        paraphrase, you don’t use quotation marks, so it is essential to reword significantly enough
        that the wording and sentence structure are your own.
      </li>
      <li>
        <strong>Summarizing</strong> is writing your own description of a larger work or a body of
        ideas. As with paraphrasing, a summary needs to be your own words. No quotation marks are
        used here, so it’s very important to distinguish your writing from the source’s.
      </li>
    </ul>
    <p>
      Whether you’re quoting, paraphrasing, or summarizing information from a source, you must
      provide a citation.
    </p>
    <pep-pharos-heading :level="3" preset="4">In-Text Citations</pep-pharos-heading>
    <p>
      In general, a citation has two parts: a brief mention of the source within the body of the
      paper, and a more detailed list at the end of the paper, called a Works Cited page. Here,
      we’ll be talking about the former type, which are called in-text citations.
    </p>
    <p>
      In MLA and APA styles, an in-text citation is a brief mention of the source that appears
      within a set of parentheses. In-text citations follow quotations, paraphrases, and summaries
      that appear as part of your text. MLA uses the author-page style of citation, which consists
      of the author’s last name plus the page number where the quote or idea appears in the source
      material.
    </p>
    <p>
      Sometimes it makes sense to incorporate the author’s name into the sentence itself. This is
      fine to do, but you always need to include a page number in parentheses for print sources. The
      purpose of this citation is to tell the reader that the quote comes from page 23 of a
      publication by an author named Harris. If the reader wants to know more about this
      publication, she can look at the Works Cited page at the end of the paper, which will include
      a complete citation for this source.
    </p>
    <figure>
      <img :src="IntextcitationHarris" alt="" class="help-tab__image" />
      <figcaption>Figure 17: Example of an in text MLA style citation</figcaption>
    </figure>
    <p>
      APA style uses the author-date style rather than author-page, so an APA citation includes the
      author’s last name and the year of publication. This citation looks slightly different, but it
      serves the same purpose: it gives the reader the information she needs to find a more detailed
      citation at the end of the paper.
    </p>
    <figure>
      <img :src="IntextcitationHarrisAPA" alt="" class="help-tab__image" />
      <figcaption>Figure 18: Example of an in text APA style citation</figcaption>
    </figure>
    <pep-pharos-heading :level="3" preset="4">Offset Citations</pep-pharos-heading>
    <p>
      Sometimes you will need to use a longer quotation as a part of your work. Rather than being
      inserted into the rest of the text, longer quotations should be indented to make the
      distinction clear to the reader. You can refer to a style guide, a book or online source
      devoted to the citation style you are using, to find the cutoff for when to indent, or offset,
      a quotation. In MLA style, offset a quotation when it makes up four or more lines of text.
    </p>
    <figure>
      <img :src="LongtextexampleMLA" alt="" class="help-tab__image" />
      <figcaption>Figure 19: Example of an offset citation in MLA style.</figcaption>
    </figure>
    <figure>
      <img :src="LongtextexampleAPA" alt="" class="help-tab__image" />
      <figcaption>Figure 20: Example of an offset citation in APA style.</figcaption>
    </figure>
    <p>
      Notice that when you offset a quotation, you don’t use quotation marks around it. In this
      case, the formatting provides a clue to the reader that this is quoted material.
    </p>
    <p>
      If the quoted material makes up less than four lines of text, it should appear as part of a
      normal paragraph, even if multiple sentences are quoted.
    </p>
  </div>
</template>
<style scoped lang="scss">
.help-tab__inner {
  max-width: 100%;
  p {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  figcaption {
    font-size: smaller;
    margin-bottom: var(--pharos-spacing-2-x);
  }
  ul {
    margin-bottom: var(--pharos-spacing-2-x);
    list-style: circle inside;
    li {
      margin-bottom: var(--pharos-spacing-one-half-x);
    }
  }
  table {
    border: 1px solid var(--pharos-color-black);
    border-collapse: collapse;
    margin-bottom: var(--pharos-spacing-2-x);
    th,
    td {
      border: 1px solid var(--pharos-color-black);
      padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-1-x);
      text-align: left;
    }
    th {
      background-color: var(--pharos-color-gray-200);
    }
  }
  .help-tab__image {
    display: block;
    max-width: 100%;
    height: auto;
    margin: var(--pharos-spacing-2-x) auto auto auto;
    max-width: 600px;
    width: 100%;
  }
}
</style>

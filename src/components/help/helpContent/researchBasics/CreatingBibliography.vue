<script setup lang="ts">
import ExampleworkscitedpageMLAstyle from '@/assets/markdown/img/ExampleworkscitedpageMLAstyle.png'
import footnotesandendnotes from '@/assets/markdown/img/footnotesandendnotes.png'
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="5--bold"
      >Creating your Works Cited or Bibliography</pep-pharos-heading
    >
    <p>
      Now that you know how to create citations and how to cite your sources within the body of a
      paper, it’s time to create the remaining piece of your citation system: a list of complete
      citations that appears at the end of your paper.
    </p>
    <p>In this lesson:</p>
    <ul>
      <li>You’ll learn how to create a Works Cited page.</li>
      <li>You’ll learn how Works Cited differs from a bibliography.</li>
      <li>
        You’ll also learn how to use notes to provide your readers with additional information.
      </li>
    </ul>
    <pep-pharos-heading :level="3" preset="4">Tracking Your Sources</pep-pharos-heading>
    <p>
      Now you’ve learned how to find and collect the elements necessary for a complete citation.
      Having all of this information handy will make it much simpler to compile your Works Cited
      page. There are several ways to keep your sources organized as you do your research:
    </p>
    <ul>
      <li>
        Fill out a note card for each source. Each card should include a complete citation for the
        source, and you can also use it to make notes about how the source is useful for your paper.
      </li>
      <li>
        Create a research log: a word-processing document or spreadsheet that lists each source,
        along with your notes.
      </li>
    </ul>
    <p>
      Use whatever method is most efficient for you. If you’re having trouble tracking down a piece
      of information you need for a citation, ask your teacher or librarian for help.
    </p>
    <pep-pharos-heading :level="3" preset="4">Works Cited</pep-pharos-heading>
    <p>
      As you know, in-text citations tell the reader which ideas and facts come from your source
      material. At the end of your paper, you’ll include a comprehensive list of all the sources
      you’ve cited. In MLA style, this section is called Works Cited. APA style calls it the
      References section. In this lesson, we’ll use these terms interchangeably.
    </p>
    <p>
      In MLA and APA style, references are listed alphabetically by author. In other styles that use
      numeric citation, the list of references will be numbered in the order they’re cited within
      the text. In both cases, the goal is that readers can see a citation within the text and refer
      to the Works Cited page to get the full information about the source used.
    </p>
    <figure>
      <img :src="ExampleworkscitedpageMLAstyle" alt="" class="help-tab__image" />
      <figcaption>Figure 21: Works cited page in MLA style</figcaption>
    </figure>
    <p>
      Here’s an important note: If a source is cited in your paper, it must be listed in the Works
      Cited. The opposite is also true: Every source included in your Works Cited must be cited
      somewhere in your paper.
    </p>
    <pep-pharos-heading :level="4" preset="2">Creating Your Works Cited Page</pep-pharos-heading>
    <p>
      To create your Works Cited page, add sources to the page as you cite them. This means that
      you’ll be transferring your source information from your note card, or research log document.
      As you add sources to your Works Cited page, be sure that:
    </p>
    <ul>
      <li>
        Citations are formatted according to your style guide
        <ul>
          <li>All the necessary elements of each citation are present</li>
          <li>
            Punctuation, capitalization, and italics are used in keeping with your style guide
          </li>
        </ul>
      </li>
      <li>Every in-text citation has a corresponding entry on the Works Cited page</li>
    </ul>
    <p>
      Organize your citations in alphabetical order by the author’s last name. If you’ve cited more
      than one source from the same author, alphabetize those sources by title. For entries
      following the first one, you’ll replace the author’s name with three hyphens.
    </p>
    <pep-pharos-heading :level="3" preset="4">Works Cited vs Bibliography</pep-pharos-heading>
    <p>
      You’ve probably heard the word “bibliography” used to talk about a list of citations. It’s
      important to note that a bibliography is not the same as a Works Cited page.
    </p>
    <p>
      As we’ve discussed, a Works Cited page is a list of the sources cited within the text of your
      paper, and only those sources. It does not include notes, and it’s formatted as a single
      alphabetical list.
    </p>
    <p>
      A bibliography is broader and more extensive; it’s a list of every source you used while
      researching your paper, whether or not you cited them specifically within the paper.
      Bibliographies may contain notes about the sources listed, and they may be split into
      subsections based on subject.
    </p>
    <p>
      In academic work in some cases, you may not be asked to prepare a bibliography. If you’re not
      clear on what your teacher is asking for, be sure to get more detail about what’s expected of
      you. You don’t want to do the extra work to prepare a bibliography unless it’s required.
    </p>
    <pep-pharos-heading :level="3" preset="4">Endnotes and Footnotes</pep-pharos-heading>
    <p>
      What if there’s a great article on your topic that you didn’t cite, but you think your readers
      would be interested in? You can do this by including notes in your paper. Notes are a way to
      provide additional information and suggestions for further reading. You will see them used in
      the articles you read in your research. And if you aren’t using them in your writing now, you
      may use them in future course work.
    </p>
    <p>
      A note has two parts: a superscript number within the text of your paper, and a corresponding
      entry in a numbered list. Within the text, use a superscript number to indicate each note. The
      text of the notes themselves can appear on a separate page at the end of your paper—these are
      called endnotes. Or, the notes can appear on the same pages as the superscript numbers—these
      are called footnotes. MLA style prefers endnotes rather than footnotes.
    </p>
    <figure>
      <img :src="footnotesandendnotes" alt="" class="help-tab__image" />
      <figcaption>Figure 22: Example of footnotes and endnotes.</figcaption>
    </figure>
    <p>
      You might want to use a note to point readers to further articles on a topic; these are called
      bibliographic notes. Or you might use a note to give additional information about a statement;
      these are called content notes.
    </p>
    <p>
      Remember that notes are optional and should be used sparingly, if at all. If notes are
      overused, you run the risk of overwhelming your reader with information, or distracting her
      from the main flow of your ideas.
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

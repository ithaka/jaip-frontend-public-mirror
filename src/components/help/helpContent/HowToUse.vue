<script setup lang="ts">
import mainSearchBox from '@/assets/markdown/img/mainSearch.png'
import requestThis from '@/assets/markdown/img/requestThis.gif'
import submitRequestMenu from '@/assets/markdown/img/submitRequestsMenu.png'
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="5--bold"> How to use JSTOR </pep-pharos-heading>
    <p class="help-tab__paragraph">
      JSTOR supports full-text keyword searching across all of the content. JSTOR generally includes
      all the content from articles, books, and pamphlets, cover to cover. This makes it possible to
      search front matter and back matter, letters to the editor, advertisements, and other types of
      material along with scholarly articles and book chapters.
    </p>
    <pep-pharos-heading :level="3" preset="4">Search JSTOR</pep-pharos-heading>
    <p class="help-tab__paragraph">
      The search form appears on the main page and also at the top of most content pages. You can
      type any search terms into the box and JSTOR will search for those terms across all of the
      content on the index.
    </p>
    <pep-pharos-heading :level="4" preset="2"
      >Here are a few things you can do to easily improve your search results:</pep-pharos-heading
    >
    <ul>
      <li>
        Place words within quotation marks to search for exact phrases (“to be or not to be”).
      </li>
      <li>
        Use Boolean operators (AND, OR, NOT) to search for alternate terms (microcredit OR
        microfinance).
      </li>
      <li>
        Use ti: to search for the title of an article or book (ti:"body ritual among the nacirema")
      </li>
    </ul>

    <p class="help-tab__paragraph">
      While we call the simple search box a "Basic Search," you can perform fairly complex queries
      with it using special codes and Boolean operators. These options are explained in more detail
      below.
    </p>
    <img :src="mainSearchBox" class="help-tab__image" alt="Main Search Box" />
    <p class="help-tab__paragraph">
      <small
        >Figure 1: The main search entry box for the JSTOR Offline Index. Type your search terms
        here and then click on the magnifying glass to do your first search.</small
      >
    </p>
    <pep-pharos-heading :level="3" preset="4"
      >Combining Search Terms & Boolean Logic</pep-pharos-heading
    >
    <p class="help-tab__paragraph">
      You can combine search terms using the Boolean operators AND, OR, and NOT.
    </p>
    <p class="help-tab__paragraph">
      <b>AND:</b> When you combine search terms with AND in a search, your results contain
      everything in which both terms appear. Combining search terms makes your search results more
      precise. You can explicitly denote AND in the following ways: cat AND dog, cat && dog, +cat
      +dog, (cat dog)
    </p>
    <p class="help-tab__paragraph">
      <b>OR:</b> Using OR between search terms allows you to find all items that contain either
      term. Using OR will search for items that contain either the word "cat", the word "dog", or
      both. For example: cat OR dog
    </p>
    <p class="help-tab__paragraph">
      <b>NOT:</b> Searches using NOT will only find items that do not contain the search term
      following it. NOT must be capitalized. To find all items with the word cat that do not contain
      the word dog, search for: cat NOT dog, cat -dog (Be sure to include a space before the dash,
      but not after).
    </p>
    <pep-pharos-heading :level="4" preset="2">Grouping Combined Search Terms</pep-pharos-heading>
    <p class="help-tab__paragraph">
      Parentheses allow you to determine the order in which terms are combined. The search "currency
      reform" AND (russia OR "soviet union") will search for items that contain the phrase currency
      reform and that contain either russia or soviet union. Without grouping parentheses, the
      search is interpreted as "currency reform" AND russia OR "soviet union," which returns items
      containing either both currency reform and russia or containing soviet union. By using
      parentheses, you may control the grouping of search terms.
    </p>
    <pep-pharos-heading :level="4" preset="2">Additional examples:</pep-pharos-heading>
    <ul>
      <li>
        (finch OR sparrow) AND exotic will search for items that contain the word exotic and either
        the word finch or the word sparrow
      </li>
      <li>
        (birds OR butterflies) NOT sparrow will search for items that contain either the word birds
        or butterflies and do not contain the word sparrow
      </li>
      <li>
        birds NOT (sparrow AND robin) will search for items that contain the word birds but do not
        contain both the words sparrow and robin
      </li>
      <li>
        birds NOT (sparrow OR robin) will search for items that contain the word birds but do not
        contain either the word sparrow or the word robin
      </li>
    </ul>
    <pep-pharos-heading :level="3" preset="4">Searching for an exact phrase</pep-pharos-heading>
    <p class="help-tab__paragraph">
      If you want to include more than one term in a field search, use parentheses () to enclose
      your search terms, or quotation marks (" ") to search for an exact phrase. The example above
      ("american revolution") searches for the exact phrase "american revolution" rather than
      treating it as a keyword search (american AND revolution).
    </p>
    <pep-pharos-heading :level="4" preset="2">Some other examples:</pep-pharos-heading>
    <ul>
      <li>
        ti:cat dog will find the word cat in the item title field and the word dog in any field
      </li>
      <li>ti:(cat dog) will find the words cat and dog in the item title field in any order</li>
      <li>ti:"color purple" will find the exact phrase color purple in the item title field</li>
      <li>
        ti:(peacekeeping AND "united nations") will find the word peacekeeping and the phrase united
        nations in the item title field
      </li>
    </ul>
    <pep-pharos-heading :level="3" preset="4"
      >Searching for multiple spellings of a word</pep-pharos-heading
    >
    <p class="help-tab__paragraph">
      Using the tilde symbol: You can find words with spellings similar to your search term by using
      the tilde ( ~ ) symbol at the end of a search term. For example, ti:dostoyevsky~ helps find
      items with dostoyevsky in the item title field, as well as variant spellings like dostoevsky,
      dostoievski, dostoevsky, dostoyevski, dostoevskii, dostoevski, etc. Note: This way of
      searching encompasses a very large number of words. Narrowing this kind of search to the item
      title or another field is recommended. The first letter always remains the same.
    </p>
    <p class="help-tab__paragraph">
      Wildcards: Wildcards take the place of one or more characters in a search term. A question
      mark is used for single character searching. An asterisk is used for multiple character
      searching. Wildcards are used to search for alternate spellings and variations on a root word.
      Wildcard characters cannot be used in place of the first letter of a word or within an exact
      phrase search.
    </p>
    <pep-pharos-heading :level="4" preset="2">Wildcard examples:</pep-pharos-heading>
    <ul>
      <li><b>wom?n</b> finds the words woman, women, womyn, etc.</li>
      <li>
        <b>bird\*</b> finds bird, birding, birdman, birds, and other words that start with bird
      </li>
      <li><b>>organi?ation</b> finds organization or organisation</li>
      <li>
        <b>behavior\*</b> searches for behavior, behavioral, behaviorist, behaviorism, or
        behaviorally
      </li>
    </ul>
    <p class="help-tab__paragraph">
      You can combine search terms containing wild cards (wom?n AND "science education") and they
      may be used in a field search: au:sm?th or ti:shakespeare\*
    </p>
    <pep-pharos-heading :level="3" preset="4">Proximity searching</pep-pharos-heading>
    <p class="help-tab__paragraph">
      JSTOR search allows you to find terms that are within a set number of words of each other
      using the tilde (~) symbol. In this example ("debt forgiveness"~10), you will only get results
      with the terms debt and forgiveness within ten words of each other. You can replace "10" with
      a different number of words.
    </p>
    <pep-pharos-heading :level="3" preset="4">Boosting term relevance</pep-pharos-heading>
    <p class="help-tab__paragraph">
      You may increase the importance of any term in your search by using the caret (^) symbol
      followed by a number that represents the rise in relevance. In the example above (cat^7 dog),
      an occurrence of the word cat in an item is seven times more important than the word dog.
    </p>
    <pep-pharos-heading :level="3" preset="4">Using field abbreviations</pep-pharos-heading>
    <p class="help-tab__paragraph">
      You can narrow search results to the fields JSTOR uses for categorization of metadata. Each
      field is represented in a search by its abbreviation. The example above (au:smith) will find
      all items for which Smith is listed as an author. Appending ty:fla to a search ("great gatsby"
      ty:fla) will limit a search to full-length articles, and ty:brv will limit a search to book
      reviews.
    </p>
    <pep-pharos-heading :level="4" preset="2"
      >Other frequently used field abbreviations are:</pep-pharos-heading
    >
    <table style="width: 100%">
      <tbody>
        <tr>
          <th>Code</th>
          <th>Returns results from:</th>
          <th>Example</th>
        </tr>
        <tr>
          <td>jo:</td>
          <td>Journal title field</td>
          <td>jo:econometrica</td>
        </tr>
        <tr>
          <td>ta:</td>
          <td>Article title field (does not search books' title fields)</td>
          <td>ta:modernism</td>
        </tr>
        <tr>
          <td>ab:</td>
          <td>
            Item abstract field (please note that only 10% of articles in JSTOR include abstracts
          </td>
          <td>ab:microfinance</td>
        </tr>
        <tr>
          <td>ca:</td>
          <td>Illustration caption field</td>
          <td>ca:rembrandt</td>
        </tr>
        <tr>
          <td>vo:</td>
          <td>Journal volume field</td>
          <td>vo:134</td>
        </tr>
      </tbody>
    </table>
    <pep-pharos-heading :level="4" preset="2"
      >Other less commonly used field abbreviations include:</pep-pharos-heading
    >
    <table style="width: 100%">
      <tbody>
        <tr>
          <th>Code</th>
          <th>Returns results from:</th>
          <th>Example</th>
        </tr>
        <tr>
          <td>cty:</td>
          <td>Book</td>
          <td>cty: (book)</td>
        </tr>
        <tr>
          <td>cty:</td>
          <td>pamphlet</td>
          <td>cty: pamphelt</td>
        </tr>
        <tr>
          <td>rt:</td>
          <td>title of a reviewed work</td>
          <td>rt: The Great Gatsby</td>
        </tr>
        <tr>
          <td>so: or jo:</td>
          <td>Journal title</td>
          <td>so: The American Economic Review</td>
        </tr>
        <tr>
          <td></td>
          <td>Journal title</td>
          <td>so: The American Economic Review</td>
        </tr>
        <tr>
          <td>no:</td>
          <td>Issue or number</td>
          <td>no: 10</td>
        </tr>
        <tr>
          <td>sn: or in:</td>
          <td>International Standard Serials Number (ISSN)</td>
          <td>in: 1944-7981</td>
        </tr>
      </tbody>
    </table>
    <pep-pharos-heading :level="3" preset="4"
      >Limiting a search to content in a specific language</pep-pharos-heading
    >
    <p class="help-tab__paragraph">
      JSTOR uses the Library of Congress's three letter MARC language codes in our metadata. You can
      append these codes to a search to limit the results to content in a specific language. An
      example: camus la:fre
    </p>

    <table style="width: 100%">
      <tbody>
        <tr>
          <th>Language</th>
          <th>Code</th>
        </tr>
        <tr>
          <td>Arabic</td>
          <td>la:ara</td>
        </tr>
        <tr>
          <td>Chinese</td>
          <td>la:chi</td>
        </tr>
        <tr>
          <td>Dutch</td>
          <td>la:dut</td>
        </tr>
        <tr>
          <td>English</td>
          <td>la:eng</td>
        </tr>
        <tr>
          <td>French</td>
          <td>la:fre</td>
        </tr>
        <tr>
          <td>German</td>
          <td>la:ger</td>
        </tr>
        <tr>
          <td>Greek Modern</td>
          <td>la:gre</td>
        </tr>
        <tr>
          <td>Hebrew</td>
          <td>la:heb</td>
        </tr>
        <tr>
          <td>Italian</td>
          <td>la:ita</td>
        </tr>
        <tr>
          <td>Japanese</td>
          <td>la:jpn</td>
        </tr>
        <tr>
          <td>Latin</td>
          <td>la:lat</td>
        </tr>
        <tr>
          <td>Portuguese</td>
          <td>la:por</td>
        </tr>
        <tr>
          <td>Russian</td>
          <td>la:rus</td>
        </tr>
        <tr>
          <td>Spanish</td>
          <td>la:spa</td>
        </tr>
        <tr>
          <td>Swedish</td>
          <td>la:swe</td>
        </tr>
        <tr>
          <td>Turkish</td>
          <td>la:tur</td>
        </tr>
      </tbody>
    </table>
    <pep-pharos-heading :level="2" preset="5--bold"
      >Understanding your search results</pep-pharos-heading
    >
    <pep-pharos-heading :level="3" preset="4">Search relevance</pep-pharos-heading>
    <p class="help-tab__paragraph">
      Relevance on JSTOR is a combination of many things. Key elements include:
    </p>
    <p class="help-tab__paragraph">
      More unique terms in the text result in higher scores when searches contain those terms. For
      example, the keyword “epistemology" gets a greater boost than “university” because it is less
      common. Phrase matches are boosted higher than just keyword matches. A search for "the quick
      brown fox" will assign higher relevance to a document containing the exact words "the quick
      brown fox" than a document containing "the brown fox is quick." More recent content is given a
      slight boost.
    </p>
    <pep-pharos-heading :level="4" preset="2">About "recent" content on JSTOR</pep-pharos-heading>
    <p class="help-tab__paragraph">
      Content on JSTOR is subject to what is called the "moving wall." The Moving Wall refers to the
      gap of content between the archival (or past) and current (more recent) issues of a journal.
      The Moving Wall is set by a journal’s publisher and ranges from 0 to 10 years, although the
      majority of journals in the JSTOR archive have a Moving Wall gap of 3 to 5 years.
    </p>
    <p class="help-tab__paragraph">
      The Wall resets, or moves forward, after a complete year, every year in early January. This is
      when another year of content is added into the JSTOR archive. The Moving Wall calculation does
      not include the current year.
    </p>
    <p class="help-tab__paragraph">
      For example, in 2019 for a journal with a Moving Wall set to 5 years, archival content goes up
      to 2013. (5 years from the previously completed year, which would be 2018). This is why you
      may not find articles from last year for some journals on JSTOR.
    </p>

    <pep-pharos-heading id="request" ref="request" :level="2" preset="5--bold">
      Requesting Materials
    </pep-pharos-heading>
    <p class="help-tab__paragraph">
      The JSTOR offline index makes requesting materials simple. During the search process, you may
      select the articles you would like by clicking "Request this." The button will turn blue and
      the text will change to "Added to cart" to show you've selected the materials. Continue
      requesting items until you're satisfied with all of your selections.
    </p>
    <p class="help-tab__paragraph">
      <i>The "Request this" button is located next to every search result.</i>
    </p>
    <p class="help-tab__paragraph">
      If you would like to view the materials you've requested and/or cancel some materials, you can
      do so by clicking the "Your requests" button at the top of the search results page.
    </p>
    <p class="help-tab__paragraph">
      <i>The "Your requests" button will display the items you have requested so far.</i>
    </p>
    <img :src="requestThis" class="help-tab__image" alt="Clicking the request this button" />
    <p class="help-tab__paragraph">
      <small>Figure 2: Clicking the "Request this" button.</small>
    </p>
    <pep-pharos-heading :level="3" preset="4">Submitting your requests</pep-pharos-heading>
    <p class="help-tab__paragraph">
      The "Your requests" button also lets you submit your requests for retrieval. When you're ready
      to submit a request, you may also include any notes about your request that could be useful to
      your librarian or administrator who will be retrieving the materials.
    </p>
    <img :src="submitRequestMenu" class="help-tab__image" alt="Submitting your requests screen" />
    <p class="help-tab__paragraph">
      <small>Figure 3: Submitting your requests screen.</small>
    </p>
  </div>
</template>
<style scoped lang="scss">
.help-tab__inner {
  max-width: 100%;
  p {
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

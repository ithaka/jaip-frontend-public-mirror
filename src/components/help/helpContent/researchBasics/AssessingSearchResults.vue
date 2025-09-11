<script setup lang="ts">
import searchResults from '@/assets/markdown/img/searchResults.png'
import searchResultsList from '@/assets/markdown/img/searchResultsList.png'
import refineSearch from '@/assets/markdown/img/refineSearch.png'
</script>
<template>
  <pep-pharos-heading id="filter" ref="filter" :level="2" preset="5--bold">
    Assessing Search Results</pep-pharos-heading
  >
  <p>
    Your next step is to assess your search results and see how they line up with your informational
    needs. Does the set of search results fit all the criteria of your query?
  </p>
  <p>
    You can often change the way your search results display, and sometimes this is helpful in
    seeing what exactly is there. Sorting by date allows you to see the newest results first and the
    oldest last, or vice versa. This can give you a sense of whether your search results are
    complete enough. If the most recent source is 20 years old, you may need to do a new search that
    yields a more current set of results, depending on your topic. Sort your results by date, using
    the year and, if possible, the month, to see which results are most current.
  </p>
  <p>
    You can also choose to display results by relevance. This gives you a quick sense of how many
    articles really focus on your search terms. If there are a couple of pages of articles that look
    promising, that may be a sign that you have a good set of search results. On the other hand, if
    only one or two of the articles in your list are truly relevant to your topic, it may be time to
    rethink your search strategy.
  </p>
  <p>
    A search that is too specific may yield few or no results. Try doing your search again with one
    or more general terms in your search string.
  </p>
  <img class="help-tab__image" :src="searchResults" alt="The search results page" />
  <p>
    <small>Figure 2: The search results page for the JSTOR Offline Index.</small>
  </p>
  <pep-pharos-heading :level="3" preset="4">Build on Good Sources</pep-pharos-heading>
  <p>
    If you have already received access to a copy of one or more sources that are a good fit, you
    can also take a look at the references the author has used in their research. The references are
    usually found at the end of an article or book. This is a good way to find related articles or
    books. You may also find that the same author has published and cited previous works on the same
    topic.
  </p>
  <pep-pharos-heading :level="3" preset="4">Managing Information Overload</pep-pharos-heading>
  <p>
    After you feel confident selecting search terms and constructing a search string, you’ll find
    yourself with a list of search results that might look great—or might be overwhelming. You might
    also find yourself with search results that are related to your topic, but are not specifically
    what you need. In this lesson, you’ll learn strategies for managing information overload.
  </p>
  <pep-pharos-heading :level="3" preset="4">Strategies</pep-pharos-heading>
  <ul>
    <li>How to plan your research efficiently based on your project outline</li>
    <li>How to refine your search for a manageable set of relevant results</li>
    <li>How to document your sources so that they’re easier to access and use</li>
  </ul>
  <img class="help-tab__image" :src="searchResultsList" alt="Many search results" />
  <p>
    <small
      >Figure 3: Receiving too many search results can feel overwhelming. Follow the tips below for
      getting the most relevant results.</small
    >
  </p>
  <pep-pharos-heading :level="3" preset="4">Keep Project Goals In Mind</pep-pharos-heading>
  <p>
    Before you begin the search process, be sure to review your project outline. Aligning your
    search with the project’s requirements will save you time in the long run. For example, if your
    assignment specifies that you use “recent” or “current” sources, you will probably want to
    narrow the dates on your search. That way, you won’t waste time reviewing resources that aren’t
    appropriate for your assignment.
  </p>
  <p>
    Keeping your project outline at the forefront will also help you know when to stop searching for
    a specific subtopic and move on to other needed information. You’ll be most efficient if you
    stop when you have enough information to complete your work.
  </p>
  <pep-pharos-heading :level="3" preset="4">Your search results</pep-pharos-heading>
  <p>
    When you’ve conducted your initial search, take a look at the results to get a sense of how
    effective your search string is.
  </p>
  <p>
    <i>First, how many results are there?</i> For example, if your search produces no results, or
    very few results, that may not be enough material for you to work with. With such a small set of
    results, you should also consider the possibility that you might be excluding some useful
    sources. If your search produces 15,000 results, on the other hand, it’s not realistic to think
    you’ll be able to review all of them to find the useful ones.
  </p>
  <p>
    <i>Next, how relevant do the results seem at a glance?</i> Have you put them in order by
    relevance? Scan through the results and see what pops out at you. Do they seem too technical,
    too broad, or just plain irrelevant? Are there terms that appear over and over — and if so, are
    those terms useful for your topic?
  </p>
  <p>
    Think of searching as <i>a process</i>, not an event. It’s pretty unusual to get a perfect,
    useful, relevant set of results from the very first search string you enter.
  </p>
  <p>Next, you’ll learn how to adjust your search to get a broader or narrower set of results.</p>
  <pep-pharos-heading :level="3" preset="4">Narrowing Search Results</pep-pharos-heading>
  <p>
    If you’re overwhelmed with search results, there are several ways to work toward a more useful
    and workable set of results.
  </p>
  <p>
    First, double-check the construction of your search string. If you’ve used a set of quotation
    marks or a set of parentheses, make sure it’s closed correctly and encloses the intended terms.
    Make sure that any Boolean operators, like AND or OR, are capitalized.
  </p>
  <p>
    Next, scan the first page or two of results and see how you might refine them. The JSTOR offline
    index includes options to <b>Refine Results</b> that allow you to be more specific about what
    results you want to see.
  </p>
  <pep-pharos-heading :level="4" preset="2">
    Here are a few of the options available:</pep-pharos-heading
  >
  <ul>
    <li>
      <b>Content Type</b> You can choose between the type of materials such as between a journal
      article or a book chapter.
    </li>
    <li>
      <b>Publication Date</b> You can select results by a certain date. To look at only the most
      recent examples, you might only check materials published after 2010.
    </li>
    <li>
      <b>Subject</b> You can narrow your search to publications in a certain field or discipline.
    </li>
    <li>
      <b>Journal</b> You can narrow your search to publications in a certain journal or journals.
    </li>
  </ul>
  <img class="help-tab__image" :src="refineSearch" alt="Tools for refining search results" />
  <p>
    <small
      >Figure 4: The <b>Refine Results</b> pane helps you filter out articles that may not be useful
      for your research.</small
    >
  </p>
  <p>
    After you’ve used <b>Refine Results</b> to narrow down your search, reassess the results and
    adjust your search string accordingly. Do you keep seeing a term or idea that isn’t relevant to
    your research? Do you see a term that is useful but isn’t in your search string? Using AND to
    add it to your search string will narrow down the current set of results.
  </p>
  <p>
    You might also reassess the terms you’ve used. Is there a more specific version that’s likely to
    get you fewer results—and results that are more specific to your topic? A search for “opera
    singers” yields a lot of results, but a search for the more specific term “mezzo sopranos”
    brings up a much smaller set.
  </p>
  <p>
    Finally, think about adding terms that narrow the search by geography, time, or discipline. A
    search for surfing will give you a lot of results, probably too many to wade through. But, a
    search about surfing in Kauai, a search about surfing in the 1920s, or a search about the
    physiology of surfers will give you a much more focused, manageable set of results.
  </p>
  <p>
    If you’re using your best search skills and are still flooded with search results, it’s possible
    that your topic is just too broad.
  </p>
  <pep-pharos-heading :level="3" preset="4">Too Few Results</pep-pharos-heading>
  <p>
    If your search gives you fewer results than you had hoped or expected, you can make a few simple
    changes to your search string that will bring you a larger set of results.
  </p>
  <p>
    First, rethink your terminology. If you’ve used a very specialized term, consider changing it to
    a broader term. For example, the specialized term “shin hanga,” a type of Japanese woodblock
    printing, yields a very small set of results. But the broader term “Japanese woodblock printing”
    gives you a much larger set of results to work with.
  </p>
  <p>
    Second, consider minor adjustments to the way your search string is constructed. If you’ve
    connected two words using AND, think about changing the operator to OR, which will produce a
    larger set of results. You can also remove one of your search terms to increase the number of
    results.
  </p>
  <p>
    Finally, try <b>truncating</b> a search term. Truncating is a way of reducing a word to its most
    basic part. This allows the database to pull up all of the forms of the word, instead of just
    the one you’ve entered. So a search for the truncated term child\* will pull up results that use
    the words child, child’s, children, and children’s—whereas searching for children’s pulls up
    only the results that use the specific form of the word.
  </p>
  <p>
    To truncate a search term, examine the search term you are using. What other variations of that
    word might be used in publications on the topic? Your goal is to reduce the word to its most
    basic form so that all of its other potential forms will come up in your search results. For
    example, if you’re looking for articles about how to teach music, use the truncated form teach\*
    to include articles that use the words teacher, teachers, and teaching.
  </p>
  <p>
    On the other hand, be aware that truncating a search term too much may bring in unrelated
    results. For example, if you are searching for information on staying in hostels, the truncated
    term host* will also get you results that discuss the unrelated topics of hostesses, hostages,
    and hostility. Truncating to hostel* will get you a more precise set of results about hostels,
    hostelry, and hostelers.
  </p>
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

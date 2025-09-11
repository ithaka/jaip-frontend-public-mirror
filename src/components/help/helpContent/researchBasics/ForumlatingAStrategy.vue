<script setup lang="ts">
import linkedPhraseSearch from '@/assets/markdown/img/linkedPhraseSearch.png'
</script>
<template>
  <pep-pharos-heading :level="2" preset="5--bold">Formulating a Search Strategy</pep-pharos-heading>
  <pep-pharos-heading :level="3" preset="4">Choosing Search Terms</pep-pharos-heading>
  <p>
    Think of a scholarly database as a vault that holds thousands upon thousands of articles, books,
    and other sources. Your key to unlock this vault is your search string: the set of words,
    phrases, and punctuation you enter into a search box to tell the database what you’re looking
    for. Every database will look and function a little differently, but you can almost always use
    the same strategies to get good results.
  </p>
  <p>
    First, try to match your terms with the language in the sources you’d like to find—that is,
    think of the terminology that is most likely to be used by scholars writing about your topic.
    These keywords and phrases will help connect you with the most relevant results. Scholarly
    publications use scholarly, formal language. So if you come up with two equivalent words or
    phrases, it might help to choose the one that seems more formal and less casual. The formal term
    influenza brings up more search results than the colloquial term flu.
  </p>
  <p>
    Next, think of synonyms and related terms that might be used instead of the main terms you’re
    searching. For example, in a search about seventeenth-century New York City, you might also want
    to use the search term New Amsterdam, which was the city’s official name at that time. In a
    search about cooking, you might want to use the related term recipes; it’s not exactly a
    synonym, but it will yield results that are closely related to your topic.
  </p>
  <pep-pharos-heading :level="3" preset="4">Putting Terms Together</pep-pharos-heading>
  <p>
    Once you’ve decided on a set of terms to use, it’s time to begin putting them together. The way
    you combine your search terms will serve as a set of instructions for the database, telling it
    what you want to see and what you don’t.
  </p>
  <p>
    For more precise results, use quotation marks around multi-word search terms. This is known as a
    <b>phrase search</b>. It tells the database to retrieve only results where these words are used
    together in a certain order. If you’re researching the theatrical group Blue Man Group, a
    keyword search for blue man group will retrieve any article where these three words appear, even
    if they are separated by other words or are out of order. On the other hand, a phrase search for
    “blue man group” in quotation marks will retrieve only articles where the words appear together
    in that order. The second group of search results is much smaller and easier to review.
  </p>
  <pep-pharos-heading :level="3" preset="4">Boolean Operators</pep-pharos-heading>
  <p>
    Consider using special words called Boolean operators: AND, OR, and NOT. These words give the
    database additional information about how to process a search that uses more than one term.
    Let’s look at some examples.
  </p>
  <ul>
    <li>
      <b>AND</b> tells the database to retrieve all of the results that contain both Term A and Term
      B. It narrows the search by leaving out results in which one term, but not the other, is used.
    </li>
    <li>
      <b>OR</b> tells the database to retrieve all of the results that contain either Term A or Term
      B. It expands the search to include all instances where either term appears. This will be the
      largest set of results — remember it as: “OR means more.”
    </li>
    <li>
      <b>NOT</b> tells the database to include one term but exclude the other. It narrows the search
      by leaving out any result that contains the second term.
    </li>
  </ul>
  <p>
    A Boolean operator should always appear in all capital letters. This tells the database to use
    the capitalized word as an instruction, not as a word that is part of your search.
  </p>
  <p>
    You can use Boolean operators not just with single words, but with phrases in quotation marks.
  </p>
  <p>
    For example, to search for information on bicycle lanes and traffic safety, link the two phrases
    together with AND.
  </p>
  <img class="help-tab__image" :src="linkedPhraseSearch" alt="Main search box on JSTOR" />
  <p>
    <small
      >Figure 1: Linking together the phrase search "bicycle lanes" with a second phrase search for
      "traffic safety" through the Boolean operator AND.</small
    >
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

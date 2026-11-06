@T02
Feature: Shopper searches by name or description
  Blocked by T01. A product matches when the trimmed text appears in its name or description
  as a case-insensitive substring. A product matches if the text matches after lower-casing with
  the Turkish locale OR after lower-casing with the default locale (clarification Q6).

  Background:
    Given the menu contains these products:
      | name            | description                 | category | price  | available |
      | Latte           | Espresso with steamed milk  | drink    | 85,00  | yes       |
      | Iced Americano  | Espresso over ice           | drink    | 70,00  | yes       |
      | Ilık Süt        | Warm milk                   | drink    | 40,00  | no        |
      | İstanbul Çayı   | Black tea in a tulip glass  | drink    | 25,00  | yes       |
      | Cheesecake      | Creamy New York style       | food     | 120,00 | yes       |
      | Croissant       | Buttery pastry              | food     | 55,00  | no        |
    And the category filter from ticket 01 works

  @US-3 @T02-AC2 @positive @logic
  Scenario: S02.1 Search matches the product name
    When the shopper opens the home page with "q=latte"
    Then the products shown are "Latte"

  @US-4 @T02-AC2 @positive @logic
  Scenario: S02.2 Search also matches the description
    When the shopper opens the home page with "q=milk"
    Then the products shown are "Latte", "Ilık Süt"

  @US-3 @T02-AC2 @edge @logic
  Scenario: S02.3 Search is a substring match, not a whole-word match
    When the shopper opens the home page with "q=spre"
    Then the products shown are "Latte", "Iced Americano"

  @US-3 @T02-AC2 @edge @logic
  Scenario: S02.4 Surrounding spaces in the text are trimmed
    When the shopper opens the home page with "q=%20%20latte%20%20"
    Then the products shown are "Latte"

  @US-3 @T02-AC2 @negative @logic
  Scenario: S02.5 Text that matches nothing returns no products
    When the shopper opens the home page with "q=xyz"
    Then no products are shown
    And the page shows "No products match your filters"

  @US-5 @T02-AC3 @positive @logic
  Scenario Outline: S02.6 Upper and lower case give the same result
    When the shopper opens the home page with "q=<text>"
    Then the products shown are "Latte"

    Examples:
      | text  |
      | latte |
      | LATTE |
      | Latte |

  @US-5 @US-6 @T02-AC3 @positive @logic
  Scenario: S02.7 An upper-case I still matches a plain lower-case i
    When the shopper opens the home page with "q=MILK"
    Then the products shown are "Latte", "Ilık Süt"

  @US-6 @T02-AC3 @positive @logic
  Scenario Outline: S02.8 Turkish dotted and dotless I are matched correctly
    When the shopper opens the home page with "q=<text>"
    Then the products shown are "<product>"

    Examples:
      | text     | product       |
      | ILIK     | Ilık Süt      |
      | ılık     | Ilık Süt      |
      | İSTANBUL | İstanbul Çayı |
      | istanbul | İstanbul Çayı |

  @US-6 @T02-AC3 @negative @logic
  Scenario: S02.9 A dotted i does not match a dotless ı
    When the shopper opens the home page with "q=ilik"
    Then no products are shown

  @US-3 @T02-AC4 @edge @logic
  Scenario Outline: S02.10 An empty or whitespace-only text means no text filter
    When the shopper opens the home page with "q=<text>"
    Then all 6 products are shown
    And no error page is shown

    Examples:
      | text      |
      |           |
      | %20       |
      | %20%20%20 |

  @US-23 @T02-AC4 @negative @logic
  Scenario: S02.11 A repeated text parameter means no text filter
    When the shopper opens the home page with "q=latte&q=milk"
    Then all 6 products are shown
    And no error page is shown

  @US-3 @T02-AC2 @negative @logic
  Scenario Outline: S02.12 The text is matched literally and never errors
    When the shopper opens the home page with "q=<text>"
    Then no products are shown
    And no error page is shown

    Examples:
      | text            | note                                       |
      | .               | a regex dot would match everything         |
      | (               | an unbalanced bracket is plain text        |
      | .*              | regex wildcard is plain text               |
      | iced%20%20amer  | two inner spaces are not collapsed         |

  @US-4 @T02-AC2 @edge @logic
  Scenario: S02.13 A product with an empty description can still be found by name
    Given the menu also contains a product "Water" with no description
    When the shopper opens the home page with "q=water"
    Then the products shown include "Water"
    And a search for "milk" does not return "Water"

  @US-3 @US-12 @T02-AC5 @positive @logic
  Scenario: S02.14 Search combines with the category filter
    When the shopper opens the home page with "q=milk&category=drink"
    Then the products shown are "Latte", "Ilık Süt"

  @US-12 @T02-AC5 @negative @logic
  Scenario: S02.15 Search and category together can exclude everything
    When the shopper opens the home page with "q=milk&category=food"
    Then no products are shown

  @US-15 @T02-AC6 @positive @manual
  Scenario: S02.16 The text input keeps the typed value and the count line follows
    When the shopper types "latte" in the search box and applies
    Then the search box shows "latte"
    And the page shows "Showing 1 of 6 products"

  @US-15 @US-21 @T02-AC6 @negative @manual
  Scenario: S02.17 A rejected text leaves the input empty
    When the shopper opens the home page with "q=latte&q=milk"
    Then the search box is empty

  @US-3 @T02-AC1 @positive @manual
  Scenario: S02.18 The filter form has a labelled search box
    When the shopper opens the home page
    Then the form has a text input with a visible label for the search text

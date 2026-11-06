# Illustrative menu used by all features. Real tests build their own inline arrays (TD-3).
# Prices are in lira; the system stores integer cents.
@T01
Feature: Shopper narrows the menu by category
  The home page has a filter form above the product grid. The filter state lives in the URL
  and filtering happens on the server. All filters combine; this ticket delivers the category
  filter, the count line, the empty state and the Clear actions.

  Background:
    Given the menu contains these products:
      | name            | description                 | category | price  | available |
      | Latte           | Espresso with steamed milk  | drink    | 85,00  | yes       |
      | Iced Americano  | Espresso over ice           | drink    | 70,00  | yes       |
      | Ilık Süt        | Warm milk                   | drink    | 40,00  | no        |
      | İstanbul Çayı   | Black tea in a tulip glass  | drink    | 25,00  | yes       |
      | Cheesecake      | Creamy New York style       | food     | 120,00 | yes       |
      | Croissant       | Buttery pastry              | food     | 55,00  | no        |

  @US-1 @US-2 @T01-AC3 @positive @logic
  Scenario: S01.1 No parameters shows the full menu
    When the shopper opens the home page without any filter
    Then all 6 products are shown

  @US-1 @T01-AC3 @positive @logic
  Scenario: S01.2 Category Drinks shows only drinks
    When the shopper opens the home page with "category=drink"
    Then the products shown are "Latte", "Iced Americano", "Ilık Süt", "İstanbul Çayı"

  @US-1 @T01-AC3 @positive @logic
  Scenario: S01.3 Category Food shows only food
    When the shopper opens the home page with "category=food"
    Then the products shown are "Cheesecake", "Croissant"

  @US-22 @T01-AC4 @negative @logic
  Scenario: S01.4 An unknown category behaves like All
    When the shopper opens the home page with "category=tea"
    Then all 6 products are shown
    And no error page is shown

  @US-23 @T01-AC4 @negative @logic
  Scenario: S01.5 A repeated category parameter behaves like All
    When the shopper opens the home page with "category=drink&category=food"
    Then all 6 products are shown
    And no error page is shown

  @US-22 @T01-AC4 @edge @logic
  Scenario: S01.6 An empty category value behaves like All
    When the shopper opens the home page with "category="
    Then all 6 products are shown

  @US-1 @US-19 @T01-AC2 @positive @manual
  Scenario: S01.7 The filter form offers a category select with Apply and Clear
    When the shopper opens the home page
    Then above the product grid there is a form with a labelled category select
    And the select offers "All", "Drinks" and "Food"
    And the form has an "Apply" button and a "Clear" link
    And all form text is in English

  @US-2 @US-15 @T01-AC5 @positive @manual
  Scenario: S01.8 The form shows the applied category
    When the shopper applies the category "Drinks"
    Then the category select shows "Drinks"
    And the address contains "category=drink"

  @US-15 @US-22 @T01-AC5 @negative @manual
  Scenario: S01.9 A rejected category is shown as All
    When the shopper opens the home page with "category=tea"
    Then the category select shows "All"

  @US-13 @T01-AC3 @positive @manual
  Scenario: S01.10 A filtered address can be bookmarked and shared
    Given the shopper opened the home page with "category=food"
    When someone else opens the same address
    Then they see only "Cheesecake" and "Croissant"

  @US-16 @T01-AC6 @positive @logic
  Scenario: S01.11 The count line shows matches of the total
    When the shopper opens the home page with "category=drink"
    Then the page shows "Showing 4 of 6 products"

  @US-16 @T01-AC6 @edge @manual
  Scenario Outline: S01.12 The count line is always shown and always says "products"
    When the shopper opens the home page with "<params>"
    Then the page shows "<line>"

    Examples:
      | params        | line                     |
      |               | Showing 6 of 6 products  |
      | category=food | Showing 2 of 6 products  |

  @US-16 @T01-AC6 @edge @manual
  Scenario: S01.13 A single match still says "products"
    Given the menu contains only one available drink among 6 products
    When the shopper filters to that drink
    Then the page shows "Showing 1 of 6 products"

  @US-17 @US-18 @T01-AC7 @negative @manual
  Scenario: S01.14 Zero matches shows the empty state with a way back
    Given a filter combination that matches no product
    Then the page shows "No products match your filters"
    And the page shows "Showing 0 of 6 products"
    When the shopper follows "Clear filters"
    Then the address is the bare home URL
    And all 6 products are shown

  @US-17 @US-18 @T01-AC7 @edge @manual
  Scenario: S01.15 An empty menu shows the same empty state
    Given the menu contains no products
    When the shopper opens the home page without any filter
    Then the page shows "No products match your filters"
    And the "Clear filters" link goes to the bare home URL

  @US-19 @T01-AC2 @positive @manual
  Scenario: S01.16 Clear resets every filter at any time
    Given the shopper opened the home page with "category=drink"
    When the shopper follows "Clear"
    Then the address is the bare home URL
    And all 6 products are shown
    And the category select shows "All"

  @US-28 @T01-AC8 @positive @manual
  Scenario: S01.17 Filtering needs no client-side script
    Given JavaScript is disabled in the browser
    When the shopper applies the category "Food"
    Then only "Cheesecake" and "Croissant" are shown

  @US-27 @T01-AC9 @edge @logic
  Scenario: S01.18 Filtering does not change the original product list
    Given the product list as it was before filtering
    When the products are filtered with "category=drink"
    Then the original product list is unchanged, in content and order

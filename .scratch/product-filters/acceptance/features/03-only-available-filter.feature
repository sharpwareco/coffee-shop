@T03
Feature: Shopper hides products that cannot be ordered
  Blocked by T01. Only the value 1 of "available" turns the filter on. When it is off,
  unavailable products stay visible. The seed data has no unavailable products, so scenarios use
  their own product lists.

  Background:
    Given the menu contains these products:
      | name            | description                 | category | price  | available |
      | Latte           | Espresso with steamed milk  | drink    | 85,00  | yes       |
      | Iced Americano  | Espresso over ice           | drink    | 70,00  | yes       |
      | Ilık Süt        | Warm milk                   | drink    | 40,00  | no        |
      | İstanbul Çayı   | Black tea in a tulip glass  | drink    | 25,00  | yes       |
      | Cheesecake      | Creamy New York style       | food     | 120,00 | yes       |
      | Croissant       | Buttery pastry              | food     | 55,00  | no        |

  @US-11 @T03-AC3 @positive @logic
  Scenario: S03.1 Only available hides unavailable products
    When the shopper opens the home page with "available=1"
    Then the products shown are "Latte", "Iced Americano", "İstanbul Çayı", "Cheesecake"
    And the page shows "Showing 4 of 6 products"

  @US-24 @T03-AC3 @positive @logic
  Scenario: S03.2 Without the filter unavailable products stay visible
    When the shopper opens the home page without any filter
    Then "Ilık Süt" and "Croissant" are shown among the 6 products

  @US-11 @T03-AC2 @negative @logic
  Scenario Outline: S03.3 Any value other than 1 leaves the filter off
    When the shopper opens the home page with "available=<value>"
    Then all 6 products are shown, including the unavailable ones

    Examples:
      | value |
      | 0     |
      | true  |
      | on    |
      | yes   |
      |       |

  @US-23 @T03-AC2 @negative @logic
  Scenario: S03.4 A repeated available parameter leaves the filter off
    When the shopper opens the home page with "available=1&available=1"
    Then all 6 products are shown, including the unavailable ones
    And no error page is shown

  @US-12 @T03-AC5 @positive @logic
  Scenario: S03.5 Only available combines with the category filter
    When the shopper opens the home page with "category=drink&available=1"
    Then the products shown are "Latte", "Iced Americano", "İstanbul Çayı"
    And the page shows "Showing 3 of 6 products"

  @US-12 @T03-AC5 @negative @logic
  Scenario: S03.6 An unavailable product is excluded even when it matches every other filter
    When the shopper opens the home page with "q=croissant&available=1"
    Then no products are shown
    And the page shows "No products match your filters"
    And the page shows "Showing 0 of 6 products"

  @US-11 @T03-AC3 @edge @logic
  Scenario: S03.7 When every product is unavailable the filter shows an empty result
    Given every product on the menu is unavailable
    When the shopper opens the home page with "available=1"
    Then no products are shown

  @US-11 @T03-AC1 @positive @manual
  Scenario: S03.8 The form has a labelled "Only available" checkbox
    When the shopper opens the home page
    Then the form has an unchecked checkbox with the visible label "Only available"

  @US-15 @T03-AC4 @positive @manual
  Scenario: S03.9 The checkbox reflects the applied state
    When the shopper ticks "Only available" and applies
    Then the address contains "available=1"
    And the checkbox is ticked

  @US-15 @T03-AC4 @negative @manual
  Scenario: S03.10 The checkbox is not ticked for other values
    When the shopper opens the home page with "available=true"
    Then the checkbox is not ticked

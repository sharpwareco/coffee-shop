@T04
Feature: Shopper filters by a price range in lira
  Blocked by T01. Accepted input is a trimmed value matching a non-negative number with an optional
  dot or comma decimal part of one or two digits. Anything else is ignored as if absent. Prices are
  stored as integer cents and converted exactly. Both ends are inclusive.

  Background:
    Given the menu contains these products:
      | name            | description                 | category | price  | available |
      | Latte           | Espresso with steamed milk  | drink    | 85,00  | yes       |
      | Iced Americano  | Espresso over ice           | drink    | 70,00  | yes       |
      | Ilık Süt        | Warm milk                   | drink    | 40,00  | no        |
      | İstanbul Çayı   | Black tea in a tulip glass  | drink    | 25,00  | yes       |
      | Cheesecake      | Creamy New York style       | food     | 120,00 | yes       |
      | Croissant       | Buttery pastry              | food     | 55,00  | no        |

  @US-7 @US-10 @T04-AC5 @positive @logic
  Scenario: S04.1 Only a minimum
    When the shopper opens the home page with "min=60"
    Then the products shown are "Latte", "Iced Americano", "Cheesecake"

  @US-8 @US-10 @T04-AC5 @positive @logic
  Scenario: S04.2 Only a maximum
    When the shopper opens the home page with "max=60"
    Then the products shown are "Ilık Süt", "İstanbul Çayı", "Croissant"

  @US-7 @US-8 @T04-AC5 @positive @logic
  Scenario: S04.3 Minimum and maximum together
    When the shopper opens the home page with "min=50&max=90"
    Then the products shown are "Latte", "Iced Americano", "Croissant"

  @US-7 @US-8 @T04-AC5 @edge @logic
  Scenario Outline: S04.4 Both ends are inclusive
    When the shopper opens the home page with "<params>"
    Then the products shown are "<products>"

    Examples:
      | params          | products                         |
      | min=70          | Latte, Iced Americano, Cheesecake |
      | max=70          | Iced Americano, Ilık Süt, İstanbul Çayı, Croissant |
      | min=70&max=70   | Iced Americano                   |

  @US-9 @T04-AC2 @positive @logic
  Scenario Outline: S04.5 A dot or a comma are both accepted as the decimal separator
    Given the menu also contains a product "Filter Coffee" priced 12,50
    When the shopper opens the home page with "min=<value>"
    Then "Filter Coffee" is shown
    And "Filter Coffee" is not shown with "min=12.51"

    Examples:
      | value |
      | 12,50 |
      | 12.50 |
      | 12.5  |

  @US-7 @T04-AC4 @edge @logic
  Scenario Outline: S04.6 Lira are converted to cents exactly
    Given the menu also contains a product "Tea Glass" priced 12,35
    When the shopper opens the home page with "<params>"
    Then "Tea Glass" is <visibility>

    Examples:
      | params     | visibility |
      | min=12.35  | shown      |
      | max=12.35  | shown      |
      | max=12.34  | not shown  |
      | min=12.36  | not shown  |
      | min=12,35  | shown      |

  @US-21 @T04-AC2 @negative @logic
  Scenario Outline: S04.7 Rejected input is ignored as if absent
    When the shopper opens the home page with "min=<value>"
    Then all 6 products are shown
    And no error page is shown

    Examples:
      | value     | why                                      |
      |           | blank                                    |
      | -5        | negative                                 |
      | abc       | letters                                  |
      | 1e3       | exponent                                 |
      | 0x10      | hex                                      |
      | 1.234     | three decimals, ignored, not rounded     |
      | .5        | no digit before the separator            |
      | 12.       | separator without decimals               |
      | 1.250,50  | thousand separators                      |
      | +5        | plus sign                                |
      | 12%2050   | inner space                              |

  @US-21 @T04-AC2 @negative @logic
  Scenario: S04.8 Rejected maximum is ignored
    When the shopper opens the home page with "max=abc"
    Then all 6 products are shown

  @US-23 @T04-AC2 @negative @logic
  Scenario: S04.9 Repeated min or max parameters are ignored
    When the shopper opens the home page with "min=50&min=90&max=60&max=70"
    Then all 6 products are shown
    And no error page is shown

  @US-21 @T04-AC3 @negative @logic
  Scenario: S04.10 A blank price is not treated as zero
    When the shopper opens the home page with "max="
    Then all 6 products are shown

  @US-7 @US-8 @T04-AC2 @edge @logic
  Scenario Outline: S04.11 Zero and leading zeros are valid
    When the shopper opens the home page with "<params>"
    Then the products shown are "<products>"

    Examples:
      | params      | products                                              |
      | min=0       | all 6 products                                        |
      | min=0,00    | all 6 products                                        |
      | max=0       | no products                                           |
      | min=0070    | Latte, Iced Americano, Cheesecake                     |

  @US-7 @US-8 @T04-AC2 @edge @logic
  Scenario: S04.12 Surrounding spaces are trimmed
    When the shopper opens the home page with "min=%2070%20"
    Then the products shown are "Latte", "Iced Americano", "Cheesecake"

  @US-20 @T04-AC6 @negative @logic
  Scenario: S04.13 A minimum above the maximum returns nothing and is not corrected
    When the shopper opens the home page with "min=100&max=50"
    Then no products are shown
    And the page shows "No products match your filters"

  @US-20 @T04-AC6 @T04-AC7 @negative @manual
  Scenario: S04.14 A minimum above the maximum stays visible in the form
    When the shopper applies minimum 100 and maximum 50
    Then the minimum field shows "100"
    And the maximum field shows "50"

  @US-7 @T04-AC2 @edge @logic
  Scenario Outline: S04.15 A value above the safe integer range is valid but extreme
    When the shopper opens the home page with "<params>"
    Then <result>
    And no error page is shown

    Examples:
      | params                    | result                    |
      | min=99999999999999999999  | no products are shown     |
      | max=99999999999999999999  | all 6 products are shown  |

  @US-12 @T04-AC8 @positive @logic
  Scenario: S04.16 The price range combines with every other filter
    When the shopper opens the home page with "category=drink&q=espresso&min=60&max=100&available=1"
    Then the products shown are "Latte", "Iced Americano"

  @US-12 @T04-AC8 @negative @logic
  Scenario: S04.17 A matching price does not override another filter
    When the shopper opens the home page with "max=60&available=1"
    Then the products shown are "İstanbul Çayı"

  @US-7 @US-8 @T04-AC1 @positive @manual
  Scenario: S04.18 The form has labelled minimum and maximum fields and the address uses lira
    When the shopper enters minimum 50 and maximum 90 and applies
    Then the address contains "min=50" and "max=90"
    And both fields have a visible label

  @US-15 @T04-AC7 @positive @manual
  Scenario: S04.19 Valid values stay in the form as typed
    When the shopper opens the home page with "min=12,50"
    Then the minimum field shows "12,50"

  @US-15 @US-21 @T04-AC7 @negative @manual
  Scenario: S04.20 Rejected values leave the field empty
    When the shopper opens the home page with "min=abc&max=1e3"
    Then the minimum field is empty
    And the maximum field is empty

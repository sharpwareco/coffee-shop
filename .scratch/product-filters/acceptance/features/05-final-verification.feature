@T05
Feature: The four filters work together on the home page
  Blocked by T02, T03, T04. All scenarios are checked in a real browser against the running app.

  Background:
    Given the menu contains these products:
      | name            | description                 | category | price  | available |
      | Latte           | Espresso with steamed milk  | drink    | 85,00  | yes       |
      | Iced Americano  | Espresso over ice           | drink    | 70,00  | yes       |
      | Ilık Süt        | Warm milk                   | drink    | 40,00  | no        |
      | İstanbul Çayı   | Black tea in a tulip glass  | drink    | 25,00  | yes       |
      | Cheesecake      | Creamy New York style       | food     | 120,00 | yes       |
      | Croissant       | Buttery pastry              | food     | 55,00  | no        |

  @US-12 @US-15 @T05-AC1 @positive @manual
  Scenario: S05.1 One address using all four filters
    When the shopper opens the home page with "category=drink&q=espresso&min=60&max=100&available=1"
    Then the products shown are "Latte", "Iced Americano"
    And the page shows "Showing 2 of 6 products"
    And the category select shows "Drinks"
    And the search box shows "espresso"
    And the minimum field shows "60" and the maximum field shows "100"
    And the "Only available" checkbox is ticked

  @US-12 @T05-AC1 @negative @manual
  Scenario: S05.2 All four filters can narrow the result to nothing
    When the shopper opens the home page with "category=drink&q=croissant&min=60&max=100&available=1"
    Then the page shows "No products match your filters"

  @US-13 @T05-AC1 @positive @manual
  Scenario: S05.3 A combined address works when shared
    Given the shopper copied the address from S05.1
    When someone else opens it in a new browser session
    Then they see the same 2 products and the same form values

  @US-18 @US-19 @T05-AC2 @positive @manual
  Scenario Outline: S05.4 Both Clear actions return to the full menu
    Given the shopper has applied the filters from <source>
    When the shopper follows "<action>"
    Then the address is the bare home URL
    And all 6 products are shown
    And every form field is back to its default

    Examples:
      | source | action        |
      | S05.1  | Clear         |
      | S05.2  | Clear filters |

  @US-14 @T05-AC3 @positive @manual
  Scenario: S05.5 Back and forward move between filter states
    Given the shopper applied "Drinks" and then applied "Food"
    When the shopper presses the browser back button
    Then the drinks view is shown and the category select shows "Drinks"
    When the shopper presses the browser forward button
    Then the food view is shown and the category select shows "Food"

  @US-14 @T05-AC3 @edge @manual
  Scenario: S05.6 Back returns past the first filter to the unfiltered menu
    Given the shopper opened the home page and then applied "Drinks"
    When the shopper presses the browser back button
    Then the full menu is shown and the form is at its defaults

  @US-26 @T05-AC4 @positive @manual
  Scenario: S05.7 The form can be submitted with Enter
    Given the shopper typed "latte" in the search box
    When the shopper presses Enter
    Then the filter is applied and only "Latte" is shown

  @US-26 @T05-AC4 @positive @manual
  Scenario: S05.8 Every control has a visible, associated label
    When the shopper clicks the label of each form control
    Then focus moves to that control
    And the controls are: category, search, minimum price, maximum price, only available

  @US-26 @T05-AC4 @edge @manual
  Scenario: S05.9 The form can be completed with the keyboard alone
    When the shopper uses only Tab, arrow keys, Space and Enter
    Then every control can be reached and changed
    And the filter can be applied

  @US-25 @T05-AC5 @positive @manual
  Scenario: S05.10 The form wraps on a phone-sized screen
    Given the browser window is 375 pixels wide
    When the shopper opens the home page
    Then every form control is visible and usable
    And the page has no horizontal scrollbar

  @US-25 @T05-AC5 @edge @manual
  Scenario: S05.11 The form with active filters still fits a narrow screen
    Given the browser window is 320 pixels wide
    When the shopper opens the home page with "category=drink&q=a%20long%20search%20text&min=100,50&max=999,99&available=1"
    Then the page has no horizontal scrollbar

  @US-22 @US-23 @US-21 @T05-AC6 @negative @manual
  Scenario Outline: S05.12 Hand-edited or malformed addresses never show an error page
    When the shopper opens the home page with "<params>"
    Then the normal home page is shown
    And no error page is shown

    Examples:
      | params                                          |
      | category=tea                                    |
      | category=drink&category=food                    |
      | q=a&q=b                                         |
      | min=abc&max=1e3                                 |
      | min=1&min=2&max=3&max=4                         |
      | available=1&available=1                         |
      | q=&min=&max=&category=&available=               |
      | foo=1&bar=2                                     |
      | category=%00&q=%FF&min=%E2%82%AC                |

  @US-21 @T05-AC6 @edge @manual
  Scenario: S05.13 Unknown parameters are ignored while known ones still apply
    When the shopper opens the home page with "foo=1&category=food"
    Then the products shown are "Cheesecake", "Croissant"

  @T05-AC7 @positive @manual
  Scenario: S05.14 The admin product list ignores home page filters
    When an administrator opens the admin product list with "category=drink&min=5"
    Then all products are listed, as before the feature

  @T05-AC7 @positive @manual
  Scenario: S05.15 The products API ignores home page filters
    When a client requests the products API with "category=drink&min=5"
    Then the full product list is returned, as before the feature

"use strict";
/**
 * @version 1.5
 * @author Michael Staatz
 * @date 2018-08-30
 * @brief
 *   This is the second try to build
 *   something usefull for me and
 *   learn the JSBox Environment.
 * @/brief
 */
let moment = require("moment");
$app.strings = {
  de: {
    title: "Meine Gruppen",
    addGroup: "Gruppe hinzufügen",
    editGroupButton: "Bearbeiten",
    deleteGroupButton: "Löschen",
    addGroupPlaceholder: "Neue Gruppe",
    detailViewTitle: "Gruppe: ",
    detailViewDeleteButton: "Löschen",
    addContactButton: "Kontakte hinzufügen",
    contactViewTitle: "Kontakübersicht",
    contactViewPhoneLabel: "Telefon",
    contactViewEmailLabel: "E-Mail",
    contactViewAddressesLabel: "Adressen",
    birthdayViewTitle: "Geburtstagsliste",
    showBirthdays: "Kalender"
  },
  en: {
    title: "My Groups",
    addGroup: "Add Group",
    editGroupButton: "Edit",
    deleteGroupButton: "delete",
    addGroupPlaceholder: "New Groupname",
    detailViewTitle: "Group: ",
    detailViewDeleteButton: "delete",
    addContactButton: "Add Contact",
    contactViewTitle: "Contactoverview",
    contactViewPhoneLabel: "Phone",
    contactViewEmailLabel: "E-Mail",
    contactViewAddressesLabel: "Addresses",
    birthdayViewTitle: "Birthdaylist",
    showBirthdays: "Calendar"
  },
  "zh-Hans": {
    title: "我的群组",
    addGroup: "添加组",
    editGroupButton: "编辑",
    deleteGroupButton: "delete",
    addGroupPlaceholder: "新组名",
    detailViewTitle: "组：",
    detailViewDeleteButton: "delete",
    addContactButton: "添加联系人",
    contactViewTitle: "联系概述",
    contactViewPhoneLabel: "手机",
    contactViewEmailLabel: "电子邮件",
    contactViewAddressesLabel: "地址",
    birthdayViewTitle: "生日清单",
    showBirthdays: "日历"
  }
};

const getBirthdays = async () => {
  let result = [];
  let groups = await $contact.fetchGroups();
  let formatter = $objc("NSISO8601DateFormatter").invoke("alloc.init");
  for (let group of groups) {
    let contacts = await $contact.fetch({
      group: group
    });
    for (let contact of contacts) {
      if (contact.birthday !== undefined) {
        let date = contact.birthday.runtimeValue().$date();
        let localizedDate = $objc("NSDateFormatter")
          .$localizedStringFromDate_dateStyle_timeStyle(date, 1, 0)
          .rawValue();
        let bdayForSort = formatter
          .$stringFromDate(date)
          .rawValue()
          .split("T")[0]
          .split("-");
        let orgYearOfBirth = +bdayForSort[0];
        bdayForSort[0] = new Date().getFullYear();
        let age = +bdayForSort[0] - orgYearOfBirth;
        bdayForSort = bdayForSort.join("-");

        if (
          moment(bdayForSort).isBetween(
            moment(),
            moment().add(1, "Month"),
            "Day",
            "[]"
          ) === false
        ) {
          continue;
        }

        result.push({
          ICON: {
            icon: $icon("212", $color("#00BB00"))
          },
          NAME: {
            text: `${localizedDate} - ${contact.givenName} ${
              contact.familyName
            } (${age})`,
            font: $font(14)
          },
          DATUM: {
            text: bdayForSort
          }
        });
      }
    }
  }

  return result.sort((a, b) => {
    let textA = a.DATUM.text;
    let textB = b.DATUM.text;

    if (textA > textB) {
      return 1;
    }

    if (textA < textB) {
      return -1;
    }
  });
};

const getGroups = async () => {
  let result = [];
  let groups = await $contact.fetchGroups();

  for (let group of groups) {
    let data = {
      ICON: {
        icon: $icon("108", $color("lightGray"))
      },
      NAME: {
        text: group.name
      }
    };
    result.push(data);
  }
  return result.sort(function(a, b) {
    if (a.NAME.text !== undefined) {
      return a.NAME.text.localeCompare(b.NAME.text);
    }
    return 0;
  });
};

let sortedGroups = await getGroups();

async function getGroupByIndex(index) {
  let groupname = sortedGroups[index].NAME.text;
  let groups = await $contact.fetchGroups();
  let result = undefined;

  for (let group of groups) {
    if (group.name === groupname) {
      result = group;
      break;
    }
  }

  return result;
}

async function deleteGroup(index) {
  let group = await getGroupByIndex(index);
  let contacts = await $contact.fetch({
    group: group
  });

  for (let contact of contacts) {
    await $contact.removeFromGroup({
      contact: contact,
      group: group
    });
  }

  await $contact.deleteGroup({
    group: group
  });

  sortedGroups = await getGroups();
}

async function updateGroup(index, newName) {
  let group = await getGroupByIndex(index);
  group.name = newName;

  await $contact.updateGroup({
    group: group
  });

  sortedGroups = await getGroups();
}

async function makeContactListByGroup(index) {
  let group = await getGroupByIndex(index);
  let contacts = await $contact.fetch({
    group: group
  });

  let names = [];
  let organisations = [];
  for (let contact of contacts) {
    let name = contact.givenName + " " + contact.familyName;
    if (name.length <= 1) {
      organisations.push({
        ICON: {
          icon: $icon("109", $color("lightGray"))
        },
        NAME: {
          text: contact.organizationName,
          font: $font(14)
        }
      });
    } else {
      names.push({
        ICON: {
          icon: $icon("109", $color("lightGray"))
        },
        NAME: {
          text: name,
          font: $font(14)
        }
      });
    }
  }

  names.sort((a, b) => {
    let textA = a.NAME.text.split(" ")[1];
    let textB = b.NAME.text.split(" ")[1];

    if (textA > textB) {
      return 1;
    }

    if (textA < textB) {
      return -1;
    }

    let textAA = a.NAME.text.split(" ")[0];
    let textBB = b.NAME.text.split(" ")[0];

    if (textAA > textBB) {
      return 1;
    }

    if (textAA < textBB) {
      return -1;
    }
  });

  organisations.sort((a, b) => {
    return a.NAME.text.localeCompare(b.NAME.text);
  });

  return names.concat(organisations);
}

const TEMPLATE = {
  props: {
    bgcolor: $color("#EFF1F1")
  },
  views: [
    {
      type: "view",
      props: {
        clipsToBounds: false,
        bgcolor: $color("white")
      },
      layout: function(make, view) {
        make.top.bottom.inset(10);
        make.left.right.inset(15);
        shadow(view);
      },
      views: [
        {
          type: "image",
          props: {
            id: "ICON",
            bgcolor: $color("clear")
          },
          layout: function(make) {
            make.size.equalTo($size(20, 20));
            make.top.inset(15);
            make.left.inset(20);
          }
        },
        {
          type: "label",
          props: {
            id: "NAME",
            font: $font(18),
            textColor: $color("darkGray")
          },
          layout: function(make, view) {
            var pre = view.prev;
            make.centerY.equalTo(pre.centerY);
            make.left.equalTo(pre.right).offset(20);
            make.width.lessThanOrEqualTo(275);
          }
        }
      ]
    }
  ]
};

function shadow(view) {
  var layer = view.runtimeValue().invoke("layer");
  layer.invoke("setCornerRadius", 10);
  layer.invoke("setShadowOffset", $size(3, 3));
  layer.invoke(
    "setShadowColor",
    $color("gray")
      .runtimeValue()
      .invoke("CGColor")
  );
  layer.invoke("setShadowOpacity", 0.3);
  layer.invoke("setShadowRadius", 5);
}

if ($app.env === $env.today || $app.env === $env.siri) {
  await birthdayView(true);
} else {
  $ui.render({
    type: "view",
    props: {
      title: $l10n("title"),
      navButtons: [
        {
          title: $l10n("addGroup"),
          icon: "104",
          handler: async function() {
            let newGroupName = await $input.text({
              type: $kbType.default,
              placeholder: $l10n("addGroupPlaceholder")
            });
            await $contact.addGroup({
              name: newGroupName
            });
            sortedGroups = await getGroups();
            $("MAIN").data = sortedGroups;
          }
        },
        {
          title: $l10n("showBirthdays"),
          icon: "125",
          handler: async function() {
            birthdayView();
          }
        }
      ]
    },
    views: [
      {
        type: "list",
        props: {
          id: "MAIN",
          bgcolor: $color("#EFF1F1"),
          separatorHidden: true,
          template: TEMPLATE,
          rowHeight: 70,
          data: sortedGroups,
          actions: [
            {
              title: $l10n("deleteGroupButton"),
              color: $color("red"),
              handler: async function(sender, indexPath) {
                await deleteGroup(indexPath.row);
                if ($device.info.language === "de") {
                  sender.delete(indexPath);
                }
              }
            },
            {
              title: $l10n("editGroupButton"),
              handler: async function(sender, indexPath) {
                let newGroupName = await $input.text({
                  type: $kbType.default,
                  placeholder: $l10n("addGroupPlaceholder")
                });
                await updateGroup(indexPath.row, newGroupName);
                $("MAIN").data = sortedGroups;
              }
            }
          ]
        },
        layout: $layout.fill,
        events: {
          pulled: function(sender) {
            sender.endRefreshing();
          },
          didSelect: function(sender, indexPath, data) {
            detailView(data.NAME.text, indexPath.row);
          }
        }
      }
    ]
  });
}
async function detailView(title, index) {
  let group = await getGroupByIndex(index);

  $ui.push({
    type: "view",
    props: {
      title: $l10n("detailViewTitle") + title,
      navButtons: [
        {
          title: $l10n("addContactButton"),
          icon: "104",
          handler: async function() {
            let newContacts = await $contact.pick({
              multi: true
            });

            for (let contact of newContacts) {
              $contact.addToGroup({
                contact: contact,
                group: group
              });
            }

            $("detaillist").data = await makeContactListByGroup(index);
          }
        }
      ]
    },
    views: [
      {
        type: "list",
        props: {
          id: "detaillist",
          bgcolor: $color("#EFF1F1"),
          separatorHidden: true,
          template: TEMPLATE,
          rowHeight: 70,
          data: await makeContactListByGroup(index),
          actions: [
            {
              title: $l10n("detailViewDeleteButton"),
              color: $color("red"),
              handler: async function(sender, indexPath) {
                let data = await makeContactListByGroup(index);
                let contacts = await $contact.fetch({
                  key: data[indexPath.row].NAME.text
                });

                $contact.removeFromGroup({
                  contact: contacts[0],
                  group: group
                });
                if ($device.info.language === "de") {
                  sender.delete(indexPath);
                }
              }
            }
          ]
        },
        layout: $layout.fill,
        events: {
          pulled: function(sender) {
            sender.endRefreshing();
          },
          didSelect: function(sender, indexPath, data) {
            contactView(sender, indexPath, data);
          }
        }
      }
    ]
  });
}

async function contactView(sender, indexPath, data) {
  let contact = await $contact.fetch({
    key: data.NAME.text
  });

  let name = contact[0].givenName + " " + contact[0].familyName;
  name = name.length <= 1 ? contact[0].organizationName : name;

  let phoneNumbers = `### ${$l10n("contactViewPhoneLabel")}\n`;
  for (let phoneNumber of contact[0].phoneNumbers) {
    let phoneNumberLabel = $objc("CNLabeledValue")
      .$localizedStringForLabel(phoneNumber.label)
      .rawValue();

    phoneNumbers +=
      "##### " +
      phoneNumberLabel +
      "\n<a href='tel:" +
      phoneNumber.content +
      "'>" +
      phoneNumber.content +
      "</a>\n";
  }
  phoneNumbers += "\n";

  let emailAddresses = `### ${$l10n("contactViewEmailLabel")}\n`;
  for (let emailAddress of contact[0].emailAddresses) {
    let emailAddressLabel = $objc("CNLabeledValue")
      .$localizedStringForLabel(emailAddress.label)
      .rawValue();

    emailAddresses += "##### " + emailAddressLabel + "\n" + emailAddress.content + "\n";
  }
  emailAddresses += "\n";

  let adresses = `### ${$l10n("contactViewAddressesLabel")}\n`;
  for (let postalAdress of contact[0].postalAddresses) {
    let postalAdressLabel = $objc("CNLabeledValue")
      .$localizedStringForLabel(postalAdress.label)
      .rawValue();
    let arPostalAdress = postalAdress.content.split(",");
    adresses +=
      "##### " +
      postalAdressLabel +
      "\n" +
      arPostalAdress[0] +
      "\n" +
      arPostalAdress[5] +
      " " +
      arPostalAdress[2] +
      "\n" +
      arPostalAdress[6] +
      "\n";
  }
  adresses += "\n";

  let markdownText = `# ${name}\n${phoneNumbers}\n${emailAddresses}\n${adresses}\n`;

  $ui.push({
    type: "view",
    props: {
      id: "mview",
      title: $l10n("contactViewTitle")
    },
    views: [
      {
        type: "markdown",
        props: {
          content: markdownText
        },
        layout: $layout.fill
      }
    ]
  });
}

async function birthdayView(today = false) {
  let template = {
    type: "view",
    props: {
      id: "bview",
      title: $l10n("birthdayViewTitle")
    },
    views: [
      {
        type: "list",
        props: {
          bgcolor: $color("#EFF1F1"),
          separatorHidden: true,
          template: TEMPLATE,
          rowHeight: 70,
          selectable: false,
          data: await getBirthdays()
        },
        layout: $layout.fill
      }
    ]
  };

  if (today === false) {
    $ui.push(template);
  } else {
    $ui.render(template);
  }
}

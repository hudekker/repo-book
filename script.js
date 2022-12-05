// "use strict";

let limits;
let list;
let fields;
let boolGist = false;
let boolSubmit;
let username;
let sortedBy = "Created";
let titleSearch = document.querySelector("#title-search");
let inputUsername = document.querySelector("#input-username");
let btnSearch = document.querySelector("#btn-search");
let btnRepo = document.querySelector("#btn-github");
let btnGist = document.querySelector("#btn-gist");
let btnDb = document.querySelector("#btn-db");
let btnGo = document.querySelector("#btn-go");

const setSpinners = (bool) => {
  let spinnerGroup = document.querySelector("#spinner-group");

  // Turn on spinner
  if (bool) {
    spinnerGroup.classList.remove("display-none");

    // Turn off spinner
  } else {
    spinnerGroup.classList.add("display-none");
  }
};

const setHashParams = (obj) => {
  let params = JSON.stringify(obj);
  location.hash = params;
};

const getHashParams = () => {
  let params = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
  if (Object.keys(params)?.length > 0) {
    return JSON.parse(Object.keys(params)[0]);
  }
  return null;
};

const getNameField = (row) => {
  let rowName;

  if (boolGist) {
    rowName = Object.keys(row.files).length ? Object.values(row.files)[0].filename : "";
  } else {
    rowName = row.name;
  }

  return rowName;
};

// class GHRequestError extends Error {
//   constructor(limits = {}, ...params) {
//     super(...params);

//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, GHRequestError);
//     }

//     this.name = "GHRequestError";
//     this.limits = limits;
//   }
// }

const htmlDescription = (row) => {
  let desc;

  if (boolGist) {
    desc = `
    <td>
        <a href="${row.html_url}" >
          ${row.description || (Object.keys(row.files).length ? Object.values(row.files)[0].filename : "<em>no description</em>")}
        </a>
    </td>
    `;

    // Github repo
  } else {
    desc = `
      <td>    
          <a href="${row.html_url}" >
            ${row.description || "<em>no description</em>"}
          </a>
      </td>    
      `;
  }

  return desc;
};

const htmlName = (row) => {
  let name;

  // Gist
  if (boolGist) {
    name = `
    <td>    
        <a href="${row.html_url}" >
            ${getNameField(row) || "<em>no description</em>"}
        </a>
    </td>
    `;

    // Repo
  } else {
    name = `
    <td>    
        <a href="${row.html_url}">
          ${row.name || "<em>no name</em>"}
        </a>
    </td>
      `;
  }

  return name;
};

const hasPages = (row) => {
  return row.has_pages ? "Yes" : "No";
};

const htmlPages = (row) => {
  let result;

  if (fields.filter((e) => e.field === "Pages").length < 1) {
    result = "";
  } else {
    if (row.has_pages) {
      result = `
      <td>
        <a href=https://${row.owner.login}.github.io/${row.name}>${hasPages(row)}</a>
      </td>
      `;
    } else {
      result = `
      <td>
        ${hasPages(row)}
      </td>
      `;
    }
  }

  return result;
};

const htmlCreated = (row) => {
  return `
  <td>
    ${row.created_at.slice(0, 10)}
  </td>
  `;
};
const htmlUpdated = (row) => {
  return `
  <td>
    ${row.updated_at.slice(0, 10)}
  </td>
  `;
};

let fieldsRepo = [
  {
    field: "Name",
    html: htmlName,
    key: getNameField,
    boolAscending: true,
  },
  {
    field: "Description",
    html: htmlDescription,
    key: (e) => e.description || getNameField(e),
    boolAscending: true,
  },
  {
    field: "Pages",
    html: htmlPages,
    key: (e) => (e.has_pages ? "Y" : "N"),
    boolAscending: false,
  },
  {
    field: "Created",
    html: htmlCreated,
    key: (e) => e.created_at,
    boolAscending: false,
  },
  {
    field: "Updated",
    html: htmlUpdated,
    key: (e) => e.updated_at,
    boolAscending: false,
  },
];

let fieldsGist = [
  {
    field: "Description",
    html: htmlDescription,
    key: (e) => e.description || getNameField(e),
    boolAscending: true,
  },
  {
    field: "Name",
    html: htmlName,
    key: getNameField,
    boolAscending: true,
  },
  {
    field: "Created",
    html: htmlCreated,
    key: (e) => e.created_at,
    boolAscending: false,
  },
  {
    field: "Updated",
    html: htmlUpdated,
    key: (e) => e.updated_at,
    boolAscending: false,
  },
];

const buildTableRow = (row) => {
  let result;

  if (boolGist) {
    result = fieldsGist.map((e) => e.html(row)).join("");
  } else {
    result = fieldsRepo.map((e) => e.html(row)).join("");
  }

  return `<tr>${result}</tr>`;
};

const buildTable = (list) =>
  list.length === 0
    ? "<div>Nothing found</div>"
    : `
  <table>
    <tbody>
      <tr>
        ${fields.map((e) => `<th>${e.field}</th>`).join("")}
      </tr>
      ${list.map(buildTableRow).join("")}
    </tbody>
  </table>
`;

const sortList = (obj) => {
  if (!obj?.sortedBy || obj?.boolAscending === undefined) return;

  sortedBy = obj.sortedBy;
  let boolAscending = obj.boolAscending;

  if (sortedBy && list) {
    let { key } = fields.find((e) => e.field === sortedBy);
    list.sort((a, b) => key(a).localeCompare(key(b)));

    if (!boolAscending) {
      list.reverse();
    }
  }
};

const handleSortClick = (evt) => {
  let field = evt.target.innerText;

  // Get the function key and default sort direction for this colHeading
  let { key, boolAscending } = fields.find((e) => e.field === field);

  // sortedBy is global and remembers last col sort.
  // If sorted twice in a row then reverse previous
  if (sortedBy === field) {
    list.reverse();
    boolAscending = evt.target.classList.contains("sorted-desc");

    // If "new" to this column then always use default sort
    // Use the key() to sort rows
  } else {
    sortedBy = field;
    list.sort((a, b) => key(a).localeCompare(key(b)));

    if (!boolAscending) {
      list.reverse();
    }
  }

  // rebuild the dom using this sorted list
  listToDOM(list);

  // update the asc or desc icon for this colHeading
  showSortedIcon(boolAscending);

  // location.hash = `#{"sortedBy":"${sortedBy}","boolAscending":"${boolAscending}"}`;
  setHashParams({ ...getHashParams(), ...{ sortedBy, boolAscending } });
};

const showSortedIcon = (boolAscending) => {
  document.querySelectorAll(".tbl-search th").forEach((e) => {
    if (e.innerText === sortedBy) {
      e.classList.add(boolAscending ? "sorted-asc" : "sorted-desc");
    }
  });
};

const listToDOM = (list) => {
  // Rebuild the dom using the list in memory
  document.querySelector(".tbl-search").innerHTML = buildTable(list);

  // Add event listeners just for the header fields
  document.querySelectorAll(".tbl-search th").forEach((el) => el.addEventListener("click", handleSortClick));
};

const limitsToDOM = (limits) => {
  document.querySelector(".github-limits").innerHTML = `
    <small>
      <em>
        ${limits.remaining}/${limits.limit} API requests remaining.
        Usage resets at ${limits.reset}.
      </em>
    </small>
  `;
};

// const handleGistsResponse = (response) => {
//   ({ limits, gists } = response);
//   limitsToDOM(limits);
//   gistsToDOM(gists);
//   showSortedIcon(fields.find((e) => e.name === sortedBy).ascending);
// };

// const handleError = (err) => {
//   const gistsEl = document.querySelector(".gists");
//   gistsEl.innerHTML = err.message;
//   limitsToDOM(err.limits);
// };

const buildList = async () => {
  try {
    fields = boolGist ? fieldsGist : fieldsRepo;
    list = [];

    // username = document.querySelector("#input-username").value;
    setSpinners(true);

    for (let page = 1; page <= 10; page++) {
      const url = boolGist ? `https://api.github.com/users/${username}/gists?page=${page}&per_page=100` : `https://api.github.com/users/${username}/repos?page=${page}&per_page=100`;

      let response = await fetch(url);

      limits = {
        remaining: response.headers.get("x-ratelimit-remaining"),
        limit: response.headers.get("x-ratelimit-limit"),
        reset: new Date(response.headers.get("x-ratelimit-reset") * 1000),
      };

      let data = await response.json();

      if (!response.ok) {
        throw "Nothing found";
      }

      list.push(...data);

      if (data.length < 100) {
        break;
      }
    }
  } catch (error) {
    console.log(`Error in fetch `, error);
    setSpinners(false);
  }

  setSpinners(false);

  // sort it
  let { key, boolAscending } = fields.find((e) => e.field === sortedBy);
  list.sort((a, b) => key(a).localeCompare(key(b)));

  if (!boolAscending) {
    list.reverse();
  }

  // sortedBy is global and it has a default value
  // use the default ascend/descend for the default col heading
  sortList(getHashParams());
  showSortedIcon(fields.find((e) => e.field === sortedBy).boolAscending);
  document.querySelector("#list-length").textContent = `${list.length} Entries`;

  limitsToDOM(limits);
  listToDOM(list);
};

const handleGistGithubParams = () => {
  fields = boolGist ? fieldsGist : fieldsRepo;

  if (boolGist) {
    btnRepo.classList.remove("on");
    btnGist.classList.add("on");
    inputUsername.placeholder = `Enter a Gist username`;
    titleSearch.innerHTML = `Gist List <span id="list-length"></span>`;
    titleSearch.classList.add("gist");
  } else {
    btnRepo.classList.add("on");
    btnGist.classList.remove("on");
    inputUsername.placeholder = `Enter a Github username`;
    titleSearch.innerHTML = `Repo List <span id="list-length"></span>`;
    titleSearch.classList.remove("gist");
  }
};

btnRepo.addEventListener("click", (e) => {
  e.preventDefault();

  boolGist = false;
  let hashParams = getHashParams();
  username = document.querySelector("#input-username").value.replace(/\s/g, "");
  setHashParams({ ...hashParams, ...{ boolGist, username } });

  handleGistGithubParams();
  sortedBy = "Created";
  setHashParams({ ...getHashParams(), ...{ sortedBy: "Created", boolAscending: false } });

  if (username) {
    buildList(username);
  }
});

const getUsername = () => {
  let l_username = document.querySelector("#input-username").value.replace(/\s/g, "");

  if (l_username === "") {
    l_username = getHashParams()?.username;
    if (l_username) document.querySelector("#input-username").value = l_username;
  }

  return l_username;
};

btnGist.addEventListener("click", (e) => {
  e.preventDefault();

  boolGist = true;
  let hashParams = getHashParams();
  username = getUsername();
  setHashParams({ ...hashParams, ...{ boolGist, username } });

  handleGistGithubParams();
  sortedBy = "Created";
  setHashParams({ ...getHashParams(), ...{ sortedBy, boolAscending: false } });

  if (username) {
    buildList(username);
  }
});

btnSearch.addEventListener("click", (event) => {
  event.preventDefault();

  btnDb.classList.toggle("on");
  btnSearch.classList.toggle("on");
  inputUsername.classList.remove("no-display");

  username = getUsername();
  let hashParams = getHashParams();

  boolGist = hashParams?.boolGist ? true : false;

  boolSubmit = true;
  setHashParams({ ...hashParams, ...{ boolGist, username, boolSubmit } });

  handleGistGithubParams();

  if (username) {
    buildList(username);
  }
});

btnDb.addEventListener("click", (event) => {
  event.preventDefault();
  btnDb.classList.toggle("on");
  btnSearch.classList.toggle("on");
  inputUsername.classList.add("no-display");

  let boolDb = btnDb.classList.contains("on");

  setHashParams({ ...getHashParams(), ...{ boolDb } });
});

btnSearch.click();

// Spinners

//Turn on spinners
// setSpinners(true);

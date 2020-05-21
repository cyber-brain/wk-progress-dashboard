let apiTokenInput = document.getElementById("api-key");
let apiTokenStorageKey = "apiTokenV2"
let statisticSelect = document.getElementById("statistic");
let confirmBtn = document.getElementById("confirm-btn");
let dataDiv = document.querySelector("div.data");

confirmBtn.addEventListener("click", updateStatistics);

function getApiToken() {
    let token = localStorage.getItem(apiTokenStorageKey);
    if (token) {
        return token;
    } else {
        let token = apiTokenInput.value;
        if (token) {
            localStorage.setItem(apiTokenStorageKey, token);
            return token;
        } else {
            alert("Please input API Token");
            throw Error("apiTokenUnavailable");
        }
    }
}

function updateStatistics() {
    try {
        var apiToken = getApiToken();
    } catch (e) {
        return;
    }
    let statistic = statisticSelect.value;
    fetchStats(statistic, apiToken);
}

function fetchStats(statistic, apiToken) {
    if (statistic === "level-ups") {
        createLevelUpTable(apiToken);
    } else if (statistic === "review-accuracy") {
        alert("getting review-accuracy");
    } else {
        alert("this statistic is not implemented");
    }
}

async function queryWkAPI(endpoint, apiToken) {
    let apiReq = new Request(
        `https://api.wanikani.com/v2/${endpoint}`,
        {
            method: 'GET',
            headers: {Authorization: `Bearer ${apiToken}`,}
        }
    );
    return fetch(apiReq).then(resp => resp.json());
}

async function createLevelUpTable(apiToken) {
    let levelUpData = await queryWkAPI("level_progressions", apiToken);

    let fields = [
        {n: "level", f: d => d.level},
        {n: "unlocked", f: d => dateFmt(d.unlocked_at)},
        {n: "started", f: d => dateFmt(d.started_at)},
        {n: "passed", f: d => dateFmt(d.passed_at)},
        {n: "days since unlocked", f: d => {
            return ((Date.parse(d.passed_at) - Date.parse(d.unlocked_at)) / (1000*60*60*24)).toFixed(1);
        }},
        {n: "days since started", f: d => {
            return ((Date.parse(d.passed_at) - Date.parse(d.started_at)) / (1000*60*60*24)).toFixed(1);
        }},
    ]
    levelUpData = levelUpData.data.map(e => {
        return fields.map(f => f.f(e.data))
    });
    dataDiv.innerHTML = "";
    dataDiv.appendChild(createTable(fields.map(f => f.n), levelUpData));
}

function dateFmt(d) {
    if (d) {
        return moment(d).format("YYYY-MM-DD HH:mm");
    } else {
        return "";
    }

}


function createTable(header, rows) {
    let table = document.createElement("table");
    let thead = createTableHead(header);
    let tbody = createTableBody(rows);
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

function createTableHead(headers) {
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    headers.forEach(h => {
        let th = document.createElement("th");
        th.textContent = h;
        tr.appendChild(th);
    })
    thead.appendChild(tr);
    return thead;
}

function createTableBody(rows) {
    let tbody = document.createElement("tbody");
    rows.forEach(r => tbody.appendChild(createTableRow(r)));
    return tbody;
}

function createTableRow(values) {
    let tr = document.createElement("tr");
    for (let v of values) {
        let td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
    }
    return tr
}

class stringConst {
  constructor() {
    this.Admin = 'admin';
    this.User = 'user';
    this.superAdmin = 'superAdmin';
    this.whiteLabel = 'whiteLabel';
    this.hyperAgent = 'hyperAgent';
    this.superAgent = 'superAgent';
    this.masterAgent = 'masterAgent';
  }
}
class statusPanelCode {
  constructor() {
    this.void = 400322;
    this.announcement = 40030;
    this.suspend = 400319;
   
  }
}

export const string = new stringConst();
export const statusPanelCodes = new statusPanelCode();

